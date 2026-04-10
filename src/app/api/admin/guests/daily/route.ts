import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { generateId } from "@/lib/utils";
import type { GuestProfile, DailyConfirmation } from "@/types";

function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

async function getGuests(): Promise<GuestProfile[]> {
  return kvGet<GuestProfile[]>("guests:registry", []);
}

async function saveGuests(list: GuestProfile[]) {
  return kvSet("guests:registry", list);
}

async function getDailyConfirmations(date: string): Promise<DailyConfirmation[]> {
  return kvGet<DailyConfirmation[]>(`guests:daily:${date}`, []);
}

async function saveDailyConfirmations(date: string, list: DailyConfirmation[]) {
  return kvSet(`guests:daily:${date}`, list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId } = body;

    if (!adminId) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

    const today = todayRO();

    // ── STATUS ── who is confirmed today, who is not
    if (action === "status") {
      const guests = await getGuests();
      const confirmations = await getDailyConfirmations(today);
      const confirmedIds = new Set(confirmations.map((c) => c.guestId));

      // Guests whose stay covers today
      const todayGuests = guests.filter(
        (g) => g.stayStart <= today && g.stayEnd >= today && g.status !== "checked_out"
      );

      const confirmed = todayGuests.filter((g) => confirmedIds.has(g.id));
      const unconfirmed = todayGuests.filter((g) => !confirmedIds.has(g.id));

      return NextResponse.json({
        success: true,
        data: { confirmed, unconfirmed, confirmations, date: today },
      });
    }

    // ── CONFIRM ── daily activation
    if (action === "confirm") {
      const { guestId, loungerId, method } = body;
      if (!guestId) {
        return NextResponse.json({ success: false, error: "guestId obligatoriu." });
      }

      const guests = await getGuests();
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }

      // Activate guest
      guests[idx].status = "active";
      if (loungerId) guests[idx].loungerId = loungerId;
      await saveGuests(guests);

      // Save daily confirmation
      const confirmations = await getDailyConfirmations(today);
      // Remove previous confirmation for this guest today (re-confirmation)
      const filtered = confirmations.filter((c) => c.guestId !== guestId);
      const confirmation: DailyConfirmation = {
        id: generateId(),
        guestId,
        date: today,
        confirmedAt: new Date().toISOString(),
        confirmedBy: adminId,
        loungerId: loungerId || guests[idx].loungerId,
        method: method || "manual",
      };
      filtered.push(confirmation);
      await saveDailyConfirmations(today, filtered);

      return NextResponse.json({ success: true, data: { guest: guests[idx], confirmation } });
    }

    // ── DEACTIVATE-ALL ── end of day
    if (action === "deactivate-all") {
      const guests = await getGuests();
      let count = 0;
      for (const g of guests) {
        if (g.status === "active") {
          g.status = "inactive";
          count++;
        }
      }
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: { deactivated: count } });
    }

    return NextResponse.json({ success: false, error: "Acțiune necunoscută." });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
