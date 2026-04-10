import { NextRequest, NextResponse } from "next/server";
import { MOCK_CREDIT_STATUS } from "@/lib/mock-data";
import { kvGet } from "@/lib/kv";
import { migrateGuests } from "@/lib/migrate-guests";
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

  const today = todayRO();
  const guests = migrateGuests(await kvGet<GuestProfile[]>("guests:registry", []));

  // Find guest by loungerIds or any member phone
  const guest = guests.find(
    (g) =>
      g.stayStart <= today &&
      g.stayEnd >= today &&
      g.status !== "checked_out" &&
      (
        g.loungerIds?.includes(umbrellaId) ||
        g.loungerId === umbrellaId ||
        (phone && g.members?.some((m) => m.phone === phone)) ||
        (phone && g.phone === phone)
      )
  );

  if (guest) {
    const isActive = guest.status === "active";
    const canOrder = isActive;
    const canRequestBill = true; // always can request bill

    if (guest.creditEnabled) {
      const limitAvailable = (guest.creditLimit || 0) - (guest.creditUsed || 0);
      return NextResponse.json({
        success: true,
        data: {
          cash: true,
          card: true,
          roomCharge: true,
          canOrder,
          canRequestBill,
          creditStatus: {
            eligible: true,
            guestName: guest.name,
            limitTotal: guest.creditLimit || 0,
            limitUsed: guest.creditUsed || 0,
            limitAvailable,
            currency: "RON",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        cash: true,
        card: true,
        roomCharge: false,
        canOrder,
        canRequestBill,
      },
    });
  }

  // Fallback - no registered guest found
  return NextResponse.json({
    success: true,
    data: {
      cash: true,
      card: true,
      roomCharge: MOCK_CREDIT_STATUS.eligible,
      creditStatus: MOCK_CREDIT_STATUS,
      canOrder: true,
      canRequestBill: true,
    },
  });
}
