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

    const guests = await getGuests();

    // ── SELF-SERVICE ACTIONS (no adminId required) ──

    // ── SELF-REGISTER ── guest registers themselves at reception QR
    if (action === "self-register") {
      const { name, phone, email, stayStart, stayEnd, groupSize } = body;
      if (!name?.trim() || !phone?.trim()) {
        return NextResponse.json({ success: false, error: "Numele si telefonul sunt obligatorii." });
      }
      // Check if phone already exists
      const existing = guests.find((g) =>
        g.status !== "checked_out" &&
        (g.phone === phone.trim() || g.members?.some((m) => m.phone === phone.trim()))
      );
      if (existing) {
        return NextResponse.json({ success: false, error: "Acest numar de telefon este deja inregistrat." });
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
    }

    // ── FIND-GROUP ── search for a group by member phone (public, limited data)
    if (action === "find-group") {
      const { phone } = body;
      if (!phone?.trim()) {
        return NextResponse.json({ success: false, error: "Telefonul este obligatoriu." });
      }
      const today = todayRO();
      const group = guests.find((g) =>
        g.status !== "checked_out" &&
        g.stayStart <= today && g.stayEnd >= today &&
        (g.phone === phone.trim() || g.members?.some((m) => m.phone === phone.trim()))
      );
      if (!group) {
        return NextResponse.json({ success: false, error: "Nu s-a gasit niciun grup cu acest numar." });
      }
      // Return limited data (no sensitive info)
      return NextResponse.json({
        success: true,
        data: {
          groupId: group.id,
          primaryName: group.name,
          memberCount: group.members?.length || 1,
          memberNames: group.members?.map((m) => m.name.split(" ")[0]) || [group.name.split(" ")[0]],
        },
      });
    }

    // ── JOIN-GROUP ── add self as member to existing group
    if (action === "join-group") {
      const { guestId, targetGroupId } = body;
      if (!guestId || !targetGroupId) {
        return NextResponse.json({ success: false, error: "Date incomplete." });
      }
      const selfIdx = guests.findIndex((g) => g.id === guestId);
      const groupIdx = guests.findIndex((g) => g.id === targetGroupId);
      if (selfIdx === -1) {
        return NextResponse.json({ success: false, error: "Profilul tau nu a fost gasit." });
      }
      if (groupIdx === -1) {
        return NextResponse.json({ success: false, error: "Grupul nu a fost gasit." });
      }
      // Add self as member to the group
      const self = guests[selfIdx];
      if (!guests[groupIdx].members) guests[groupIdx].members = [];
      const alreadyInGroup = guests[groupIdx].members.some((m) => m.phone === self.phone);
      if (!alreadyInGroup) {
        guests[groupIdx].members.push({
          phone: self.phone,
          name: self.name,
          email: self.email,
        });
      }
      // Remove the individual profile (merged into group)
      guests.splice(selfIdx, 1);
      await saveGuests(guests);
      const updatedGroupIdx = guests.findIndex((g) => g.id === targetGroupId);
      return NextResponse.json({
        success: true,
        data: {
          groupId: targetGroupId,
          memberCount: guests[updatedGroupIdx]?.members?.length || 1,
        },
      });
    }

    // ── ADMIN ACTIONS (require adminId) ──
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

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

    // ── PENDING-LIST ── get all pending validation guests
    if (action === "pending-list") {
      const pending = guests.filter((g) => g.status === "pending_validation");
      return NextResponse.json({ success: true, data: pending });
    }

    // ── APPROVE-REGISTRATION ──
    if (action === "approve-registration") {
      const { guestId } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      guests[idx].status = "registered";
      guests[idx].registeredBy = adminId;
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── REJECT-REGISTRATION ──
    if (action === "reject-registration") {
      const { guestId } = body;
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Oaspete negăsit." });
      }
      guests.splice(idx, 1);
      await saveGuests(guests);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acțiune necunoscută." });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
