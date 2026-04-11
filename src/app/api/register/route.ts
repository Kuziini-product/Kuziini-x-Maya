import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { generateId } from "@/lib/utils";
import { todayRO } from "@/lib/lounger-utils";
import type { GuestProfile } from "@/types";

export async function POST(req: Request) {
  try {
    const { name, phone, email, stayStart, stayEnd, groupSize } = await req.json();
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ success: false, error: "Numele si telefonul sunt obligatorii." }, { status: 400 });
    }
    const guests = await getGuests();
    const existing = guests.find((g) =>
      g.status !== "checked_out" &&
      (g.phone === phone.trim() || g.members?.some((m) => m.phone === phone.trim()))
    );
    if (existing) {
      return NextResponse.json({ success: false, error: "Acest numar de telefon este deja inregistrat." }, { status: 409 });
    }
    const today = todayRO();
    const now = new Date().toISOString();
    const guest: GuestProfile = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      members: [{ phone: phone.trim(), name: name.trim(), email: (email || "").trim() }],
      loungerIds: [],
      loungerId: "",
      stayStart: stayStart || today,
      stayEnd: stayEnd || today,
      status: "pending_validation",
      creditEnabled: false,
      creditLimit: 0,
      creditUsed: 0,
      registeredAt: now,
      registeredBy: "self",
      notes: "",
      groupSize: groupSize || 1,
      loungerHistory: [],
    };
    guests.push(guest);
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: { id: guest.id, name: guest.name, phone: guest.phone } });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
