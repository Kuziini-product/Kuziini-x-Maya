import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";
import { getGuestForLounger, todayRO } from "@/lib/lounger-utils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(["super_admin", "guest_admin"]);
    const { loungerId } = await req.json() as { loungerId: string };
    if (!loungerId) return NextResponse.json({ success: false, error: "ID sezlong obligatoriu." }, { status: 400 });
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    const lid = loungerId.trim().toUpperCase();
    const today = todayRO();
    const conflict = getGuestForLounger(guests, lid, today);
    if (conflict && conflict.id !== params.id) return NextResponse.json({ success: false, error: `Sezlongul ${lid} este ocupat de ${conflict.name}.` }, { status: 409 });
    if (!guests[idx].loungerIds) guests[idx].loungerIds = [];
    if (!guests[idx].loungerIds.includes(lid)) {
      guests[idx].loungerIds.push(lid);
      if (!guests[idx].loungerHistory) guests[idx].loungerHistory = [];
      guests[idx].loungerHistory!.push({ date: today, loungerId: lid, action: "assigned", timestamp: new Date().toISOString(), by: session.adminId });
    }
    guests[idx].loungerId = guests[idx].loungerIds[0];
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guests[idx] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
    const { loungerId } = await req.json() as { loungerId: string };
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    if (!guests[idx].loungerIds || guests[idx].loungerIds.length <= 1) return NextResponse.json({ success: false, error: "Trebuie sa ramana cel putin un sezlong." }, { status: 400 });
    guests[idx].loungerIds = guests[idx].loungerIds.filter((l) => l !== loungerId);
    guests[idx].loungerId = guests[idx].loungerIds[0];
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guests[idx] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
