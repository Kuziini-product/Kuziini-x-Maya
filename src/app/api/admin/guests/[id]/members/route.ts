import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";
import type { GuestMember } from "@/types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
    const { member } = await req.json() as { member: GuestMember };
    if (!member?.phone) return NextResponse.json({ success: false, error: "Telefonul membrului este obligatoriu." }, { status: 400 });
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    const phoneExists = guests.some((g) => g.members?.some((m) => m.phone === member.phone));
    if (phoneExists) return NextResponse.json({ success: false, error: `Telefonul ${member.phone} este deja inregistrat.` }, { status: 409 });
    if (!guests[idx].members) guests[idx].members = [];
    guests[idx].members.push(member);
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
    const { phone } = await req.json() as { phone: string };
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    if (!guests[idx].members || guests[idx].members.length <= 1) return NextResponse.json({ success: false, error: "Nu se poate sterge ultimul membru." }, { status: 400 });
    if (guests[idx].members[0].phone === phone) return NextResponse.json({ success: false, error: "Nu se poate sterge membrul principal." }, { status: 400 });
    guests[idx].members = guests[idx].members.filter((m) => m.phone !== phone);
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guests[idx] });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
