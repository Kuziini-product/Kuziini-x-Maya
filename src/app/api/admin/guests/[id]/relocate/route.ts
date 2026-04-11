import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";
import { todayRO } from "@/lib/lounger-utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(["super_admin", "guest_admin"]);
    const { newLoungerId, reason } = await req.json() as { newLoungerId: string; reason: string };
    if (!newLoungerId) return NextResponse.json({ success: false, error: "newLoungerId este obligatoriu." }, { status: 400 });
    if (!reason?.trim()) return NextResponse.json({ success: false, error: "Motivul relocării este obligatoriu." }, { status: 400 });
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    const oldLoungerId = guests[idx].loungerId;
    const now = new Date().toISOString();
    const today = todayRO();
    if (!guests[idx].loungerHistory) guests[idx].loungerHistory = [];
    guests[idx].loungerHistory!.push({ date: today, loungerId: oldLoungerId, action: "relocated_from", reason: reason.trim(), timestamp: now, by: session.adminId });
    const newLid = newLoungerId.trim().toUpperCase();
    guests[idx].loungerHistory!.push({ date: today, loungerId: newLid, action: "relocated_to", reason: reason.trim(), timestamp: now, by: session.adminId });
    if (guests[idx].loungerIds) {
      const lidIdx = guests[idx].loungerIds.indexOf(oldLoungerId);
      if (lidIdx !== -1) guests[idx].loungerIds[lidIdx] = newLid;
      else guests[idx].loungerIds.push(newLid);
    } else {
      guests[idx].loungerIds = [newLid];
    }
    guests[idx].loungerId = guests[idx].loungerIds[0];
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guests[idx] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
