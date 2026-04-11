import { NextResponse } from "next/server";
import { kvGet } from "@/lib/kv";
import { getGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";
import { todayRO } from "@/lib/lounger-utils";
import type { DailyConfirmation } from "@/types";

export async function GET() {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
  }
  try {
    const today = todayRO();
    const guests = await getGuests();
    const confirmations = await kvGet<DailyConfirmation[]>(`guests:daily:${today}`, []);
    const confirmedIds = new Set(confirmations.map((c) => c.guestId));
    const todayGuests = guests.filter(
      (g) => g.stayStart <= today && g.stayEnd >= today && g.status !== "checked_out"
    );
    const confirmed = todayGuests.filter((g) => confirmedIds.has(g.id));
    const unconfirmed = todayGuests.filter((g) => !confirmedIds.has(g.id));
    return NextResponse.json({ success: true, data: { confirmed, unconfirmed, confirmations, date: today } });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
