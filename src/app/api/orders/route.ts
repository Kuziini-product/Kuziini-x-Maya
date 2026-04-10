import { NextRequest, NextResponse } from "next/server";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { kvGet } from "@/lib/kv";
import { migrateGuests } from "@/lib/migrate-guests";
import { getAllPhonesForGuest } from "@/lib/lounger-utils";
import { sleep } from "@/lib/utils";
import type { GuestProfile } from "@/types";

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

  // Find the guest card for this phone to get all family phones
  let phoneSet = new Set<string>();
  let loungerSet = new Set<string>();

  if (phone) {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
    const guests = migrateGuests(await kvGet<GuestProfile[]>("guests:registry", []));
    const guest = guests.find(
      (g) =>
        g.stayStart <= today && g.stayEnd >= today && g.status !== "checked_out" &&
        (g.members?.some((m) => m.phone === phone) || g.phone === phone)
    );
    if (guest) {
      // Get all phones and loungers for this family group
      phoneSet = new Set(getAllPhonesForGuest(guest));
      loungerSet = new Set(guest.loungerIds || [guest.loungerId]);
    } else {
      phoneSet.add(phone);
    }
  }

  let orders = MOCK_ORDERS.filter((o) => {
    // Match by umbrella
    if (o.umbrellaId === umbrellaId) return true;
    // Match by any phone in the family group
    if (phoneSet.size > 0 && phoneSet.has(o.guestPhone)) return true;
    // Match by any lounger in the family group
    if (loungerSet.size > 0 && (loungerSet.has(o.umbrellaId) || loungerSet.has(o.deliveryUmbrellaId))) return true;
    return false;
  });

  return NextResponse.json({ success: true, data: { orders } });
}
