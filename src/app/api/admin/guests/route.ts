import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { generateId } from "@/lib/utils";
import { migrateGuests } from "@/lib/migrate-guests";
import { getGuestForLounger, todayRO } from "@/lib/lounger-utils";
import type { GuestProfile, GuestMember } from "@/types";

const KV_KEY = "guests:registry";

async function getGuests(): Promise<GuestProfile[]> {
  const raw = await kvGet<GuestProfile[]>(KV_KEY, []);
  return migrateGuests(raw);
}

async function saveGuests(list: GuestProfile[]) {
  return kvSet(KV_KEY, list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId } = body;

    if (!adminId) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

    const guests = await getGuests();

    // ── LIST ──
    if (action === "list") {
      const { status, date } = body;
      let filtered = guests;
      if (status) filtered = filtered.filter((g) => g.status === status);
      if (date) filtered = filtered.filter((g) => g.stayStart <= date && g.stayEnd >= date);
      return NextResponse.json({ success: true, data: filtered });
    }

    // ── SEARCH ──
    if (action === "search") {
      const { query } = body;
      if (!query) return NextResponse.json({ success: true, data: [] });
      const q = query.toLowerCase();
      const results = guests.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.phone.includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.loungerIds?.some((lid) => lid.toLowerCase().includes(q)) ||
          g.loungerId.toLowerCase().includes(q) ||
          g.members?.some((m) =>
            m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.email.toLowerCase().includes(q)
          )
      );
      return NextResponse.json({ success: true, data: results });
    }

    // ── CREATE (Check-in) ──
    if (action === "create") {
      const { name, phone, email, stayStart, stayEnd, loungerId, loungerIds, members, creditEnabled, creditLimit, notes } = body;
      if (!name || !phone) {
        return NextResponse.json({ success: false, error: "Numele și telefonul sunt obligatorii." });
      }
      const today = todayRO();

      // Build members array
      const guestMembers: GuestMember[] = members && members.length > 0
        ? members
        : [{ phone, name, email: email || "" }];

      // Build loungerIds array
      const guestLoungerIds: string[] = loungerIds && loungerIds.length > 0
        ? loungerIds.map((id: string) => id.trim().toUpperCase())
        : loungerId ? [loungerId.trim().toUpperCase()] : [];

      // Check conflicts for all loungers
      for (const lid of guestLoungerIds) {
        const conflict = getGuestForLounger(guests, lid, today);
        if (conflict) {
          return NextResponse.json({
            success: false,
            error: `Sezlongul ${lid} este deja ocupat de ${conflict.name}.`,
          });
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
    }

    // ── UPDATE ──
    if (action === "update") {
      const { guestId, ...updates } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
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
      // Sync backward compat fields
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
    }

    // ── ADD-MEMBER ──
    if (action === "add-member") {
      const { guestId, member } = body as { guestId: string; member: GuestMember };
      if (!member?.phone) {
        return NextResponse.json({ success: false, error: "Telefonul membrului este obligatoriu." });
      }
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      // Check phone uniqueness
      const phoneExists = guests.some((g) =>
        g.members?.some((m) => m.phone === member.phone)
      );
      if (phoneExists) {
        return NextResponse.json({ success: false, error: `Telefonul ${member.phone} este deja inregistrat.` });
      }
      if (!guests[idx].members) guests[idx].members = [];
      guests[idx].members.push(member);
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── REMOVE-MEMBER ──
    if (action === "remove-member") {
      const { guestId, phone: memberPhone } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      if (!guests[idx].members || guests[idx].members.length <= 1) {
        return NextResponse.json({ success: false, error: "Nu se poate sterge ultimul membru." });
      }
      if (guests[idx].members[0].phone === memberPhone) {
        return NextResponse.json({ success: false, error: "Nu se poate sterge membrul principal." });
      }
      guests[idx].members = guests[idx].members.filter((m) => m.phone !== memberPhone);
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── ADD-LOUNGER ──
    if (action === "add-lounger") {
      const { guestId, loungerId: newLid } = body;
      if (!newLid) {
        return NextResponse.json({ success: false, error: "ID sezlong obligatoriu." });
      }
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      const lid = newLid.trim().toUpperCase();
      const today = todayRO();
      const conflict = getGuestForLounger(guests, lid, today);
      if (conflict && conflict.id !== guestId) {
        return NextResponse.json({ success: false, error: `Sezlongul ${lid} este ocupat de ${conflict.name}.` });
      }
      if (!guests[idx].loungerIds) guests[idx].loungerIds = [];
      if (!guests[idx].loungerIds.includes(lid)) {
        guests[idx].loungerIds.push(lid);
        if (!guests[idx].loungerHistory) guests[idx].loungerHistory = [];
        guests[idx].loungerHistory!.push({
          date: today,
          loungerId: lid,
          action: "assigned",
          timestamp: new Date().toISOString(),
          by: adminId,
        });
      }
      guests[idx].loungerId = guests[idx].loungerIds[0];
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── REMOVE-LOUNGER ──
    if (action === "remove-lounger") {
      const { guestId, loungerId: removeLid } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      if (!guests[idx].loungerIds || guests[idx].loungerIds.length <= 1) {
        return NextResponse.json({ success: false, error: "Trebuie sa ramana cel putin un sezlong." });
      }
      guests[idx].loungerIds = guests[idx].loungerIds.filter((l) => l !== removeLid);
      guests[idx].loungerId = guests[idx].loungerIds[0];
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── RELOCATE (with mandatory reason + history) ──
    if (action === "relocate") {
      const { guestId, newLoungerId, reason } = body;
      if (!guestId || !newLoungerId) {
        return NextResponse.json({ success: false, error: "guestId si newLoungerId sunt obligatorii." });
      }
      if (!reason || !reason.trim()) {
        return NextResponse.json({ success: false, error: "Motivul relocării este obligatoriu." });
      }
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      const oldLoungerId = guests[idx].loungerId;
      const now = new Date().toISOString();
      const today = todayRO();

      if (!guests[idx].loungerHistory) guests[idx].loungerHistory = [];
      guests[idx].loungerHistory!.push({
        date: today, loungerId: oldLoungerId, action: "relocated_from",
        reason: reason.trim(), timestamp: now, by: adminId,
      });
      guests[idx].loungerHistory!.push({
        date: today, loungerId: newLoungerId.trim().toUpperCase(), action: "relocated_to",
        reason: reason.trim(), timestamp: now, by: adminId,
      });

      // Update in loungerIds array
      const newLid = newLoungerId.trim().toUpperCase();
      if (guests[idx].loungerIds) {
        const lidIdx = guests[idx].loungerIds.indexOf(oldLoungerId);
        if (lidIdx !== -1) {
          guests[idx].loungerIds[lidIdx] = newLid;
        } else {
          guests[idx].loungerIds.push(newLid);
        }
      } else {
        guests[idx].loungerIds = [newLid];
      }
      guests[idx].loungerId = guests[idx].loungerIds[0];
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── HISTORY ──
    if (action === "history") {
      const { guestId } = body;
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      return NextResponse.json({ success: true, data: guest.loungerHistory || [] });
    }

    // ── CHECKOUT ──
    if (action === "checkout") {
      const { guestId } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      guests[idx].status = "checked_out";
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    return NextResponse.json({ success: false, error: "Acțiune necunoscută." });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
