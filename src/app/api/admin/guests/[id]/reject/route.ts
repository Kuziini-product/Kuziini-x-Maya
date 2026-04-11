import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    guests.splice(idx, 1);
    await saveGuests(guests);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
