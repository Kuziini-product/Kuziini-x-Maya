import { NextRequest, NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { generateId } from "@/lib/utils";
import { getGuestForLounger, todayRO } from "@/lib/lounger-utils";
import { requireAuth, AuthError } from "@/lib/auth";
import type { GuestProfile, GuestMember } from "@/types";

// GET /api/admin/guests — list all guests (with optional filters)
export async function GET(req: NextRequest) {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
  }
  try {
    const guests = await getGuests();
    const status = req.nextUrl.searchParams.get("status");
    const date = req.nextUrl.searchParams.get("date");
    const q = req.nextUrl.searchParams.get("q")?.toLowerCase();

    let filtered = guests;
    if (status) filtered = filtered.filter((g) => g.status === status);
    if (date) filtered = filtered.filter((g) => g.stayStart <= date && g.stayEnd >= date);
    if (q) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.loungerIds?.some((lid) => lid.toLowerCase().includes(q)) ||
        g.loungerId.toLowerCase().includes(q) ||
        g.members?.some((m) =>
          m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.email.toLowerCase().includes(q)
        )
      );
    }
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}

// POST /api/admin/guests — create (check-in) a new guest
export async function POST(req: Request) {
  try {
    const session = await requireAuth(["super_admin", "guest_admin"]);
    const body = await req.json();
    const { name, phone, email, stayStart, stayEnd, loungerId, loungerIds, members, creditEnabled, creditLimit, notes, groupSize } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "Numele și telefonul sunt obligatorii." }, { status: 400 });
    }

    const guests = await getGuests();
    const today = todayRO();
    const adminId = session.adminId;

    const guestMembers: GuestMember[] = members && members.length > 0
      ? members
      : [{ phone, name, email: email || "" }];

    const guestLoungerIds: string[] = loungerIds && loungerIds.length > 0
      ? loungerIds.map((id: string) => id.trim().toUpperCase())
      : loungerId ? [loungerId.trim().toUpperCase()] : [];

    for (const lid of guestLoungerIds) {
      const conflict = getGuestForLounger(guests, lid, today);
      if (conflict) {
        return NextResponse.json({ success: false, error: `Sezlongul ${lid} este deja ocupat de ${conflict.name}.` }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const guest: GuestProfile = {
      id: generateId(),
      name: guestMembers[0].name,
      phone: guestMembers[0].phone,
      email: guestMembers[0].email,
      members: guestMembers,
      loungerIds: guestLoungerIds,
      loungerId: guestLoungerIds[0] || "",
      stayStart: stayStart || today,
      stayEnd: stayEnd || today,
      status: "registered",
      creditEnabled: creditEnabled || false,
      creditLimit: creditLimit || 0,
      creditUsed: 0,
      registeredAt: now,
      registeredBy: adminId,
      notes: notes || "",
      groupSize: groupSize || guestMembers.length,
      loungerHistory: guestLoungerIds.map((lid) => ({
        date: today,
        loungerId: lid,
        action: "assigned" as const,
        timestamp: now,
        by: adminId,
      })),
    };
    guests.push(guest);
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: guest });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
