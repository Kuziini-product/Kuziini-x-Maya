import { NextRequest, NextResponse } from "next/server";
import { MOCK_CREDIT_STATUS } from "@/lib/mock-data";
import { kvGet } from "@/lib/kv";
import { sleep } from "@/lib/utils";
import type { GuestProfile } from "@/types";

function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

export async function GET(req: NextRequest) {
  await sleep(200);
  const { searchParams } = new URL(req.url);
  const umbrellaId = searchParams.get("umbrellaId");
  const phone = searchParams.get("phone");

  if (!umbrellaId) {
    return NextResponse.json({ success: false, error: "umbrellaId obligatoriu." }, { status: 400 });
  }

  // Check if there's a registered guest on this lounger with credit enabled
  const today = todayRO();
  const guests = await kvGet<GuestProfile[]>("guests:registry", []);
  const activeGuest = guests.find(
    (g) =>
      g.status === "active" &&
      g.stayStart <= today &&
      g.stayEnd >= today &&
      (g.loungerId === umbrellaId || (phone && g.phone === phone))
  );

  if (activeGuest && activeGuest.creditEnabled) {
    const limitAvailable = (activeGuest.creditLimit || 0) - (activeGuest.creditUsed || 0);
    return NextResponse.json({
      success: true,
      data: {
        cash: true,
        card: true,
        roomCharge: true,
        creditStatus: {
          eligible: true,
          guestName: activeGuest.name,
          limitTotal: activeGuest.creditLimit || 0,
          limitUsed: activeGuest.creditUsed || 0,
          limitAvailable,
          currency: "RON",
        },
      },
    });
  }

  // Fallback to mock credit status or no credit
  return NextResponse.json({
    success: true,
    data: {
      cash: true,
      card: true,
      roomCharge: MOCK_CREDIT_STATUS.eligible,
      creditStatus: MOCK_CREDIT_STATUS,
    },
  });
}

