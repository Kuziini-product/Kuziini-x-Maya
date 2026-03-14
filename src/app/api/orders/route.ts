import { NextRequest, NextResponse } from "next/server";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function GET(req: NextRequest) {
  await sleep(200);

  const { searchParams } = new URL(req.url);
  const umbrellaId = searchParams.get("umbrellaId");
  const phone = searchParams.get("phone");

  if (!umbrellaId) {
    return NextResponse.json(
      { success: false, error: "umbrellaId este obligatoriu." },
      { status: 400 }
    );
  }

  let orders = MOCK_ORDERS.filter((o) => o.umbrellaId === umbrellaId);

  if (phone) {
    orders = orders.filter((o) => o.guestPhone === phone);
  }

  return NextResponse.json({ success: true, data: { orders } });
}
