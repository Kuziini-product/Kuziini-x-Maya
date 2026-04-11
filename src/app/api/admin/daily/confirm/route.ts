import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { generateId } from "@/lib/utils";
import { requireAuth, AuthError } from "@/lib/auth";
import { todayRO } from "@/lib/lounger-utils";
import type { DailyConfirmation } from "@/types";

export async function POST(req: Request) {
  try {
    const session = await requireAuth(["super_admin", "guest_admin"]);
    const { guestId, loungerId, method } = await req.json();
    if (!guestId) return NextResponse.json({ success: false, error: "guestId obligatoriu." }, { status: 400 });
    const today = todayRO();
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === guestId);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    guests[idx].status = "active";
    if (loungerId) guests[idx].loungerId = loungerId;
    await saveGuests(guests);
    const confirmations = await kvGet<DailyConfirmation[]>(`guests:daily:${today}`, []);
    const filtered = confirmations.filter((c) => c.guestId !== guestId);
    const confirmation: DailyConfirmation = {
      id: generateId(),
      guestId,
      date: today,
      confirmedAt: new Date().toISOString(),
      confirmedBy: session.adminId,
      loungerId: loungerId || guests[idx].loungerId,
      method: method || "manual",
    };
    filtered.push(confirmation);
    await kvSet(`guests:daily:${today}`, filtered);
    return NextResponse.json({ success: true, data: { guest: guests[idx], confirmation } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
