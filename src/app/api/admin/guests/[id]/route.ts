import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";
import type { GuestProfile } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
  }
  try {
    const updates = await req.json();
    const guests = await getGuests();
    const idx = guests.findIndex((g) => g.id === params.id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Oaspete negăsit." }, { status: 404 });
    }
    const allowed: (keyof GuestProfile)[] = [
      "name", "phone", "email", "stayStart", "stayEnd",
      "loungerId", "loungerIds", "members", "status",
      "creditEnabled", "creditLimit", "notes",
    ];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        (guests[idx] as unknown as Record<string, unknown>)[key] = updates[key];
      }
    }
    if (updates.members && updates.members.length > 0) {
      guests[idx].phone = updates.members[0].phone;
      guests[idx].name = updates.members[0].name;
      guests[idx].email = updates.members[0].email;
    }
    if (updates.loungerIds && updates.loungerIds.length > 0) {
      guests[idx].loungerId = updates.loungerIds[0];
    }
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guests[idx] });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
