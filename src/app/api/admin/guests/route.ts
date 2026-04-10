import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { generateId } from "@/lib/utils";
import type { GuestProfile } from "@/types";

const KV_KEY = "guests:registry";

async function getGuests(): Promise<GuestProfile[]> {
  return kvGet<GuestProfile[]>(KV_KEY, []);
}

async function saveGuests(list: GuestProfile[]) {
  return kvSet(KV_KEY, list);
}

function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
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
          g.loungerId.toLowerCase().includes(q)
      );
      return NextResponse.json({ success: true, data: results });
    }

    // ── CREATE (Check-in) ──
    if (action === "create") {
      const { name, phone, email, stayStart, stayEnd, loungerId, creditEnabled, creditLimit, notes } = body;
      if (!name || !phone) {
        return NextResponse.json({ success: false, error: "Numele și telefonul sunt obligatorii." });
      }
      // Check if lounger is already taken by an active guest today
      const today = todayRO();
      const conflict = guests.find(
        (g) =>
          g.loungerId === loungerId &&
          g.status !== "checked_out" &&
          g.status !== "inactive" &&
          g.stayStart <= today &&
          g.stayEnd >= today
      );
      if (conflict) {
        return NextResponse.json({
          success: false,
          error: `Sezlongul ${loungerId} este deja ocupat de ${conflict.name}.`,
        });
      }

      const now = new Date().toISOString();
      const guest: GuestProfile = {
        id: generateId(),
        name,
        phone,
        email: email || "",
        stayStart: stayStart || today,
        stayEnd: stayEnd || today,
        loungerId: loungerId || "",
        status: "registered",
        creditEnabled: creditEnabled || false,
        creditLimit: creditLimit || 0,
        creditUsed: 0,
        registeredAt: now,
        registeredBy: adminId,
        notes: notes || "",
        loungerHistory: loungerId ? [{
          date: today,
          loungerId,
          action: "assigned" as const,
          timestamp: now,
          by: adminId,
        }] : [],
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
        "loungerId", "status", "creditEnabled", "creditLimit", "notes",
      ];
      for (const key of allowed) {
        if (updates[key] !== undefined) {
          (guests[idx] as unknown as Record<string, unknown>)[key] = updates[key];
        }
      }
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

      // Initialize history if not exists
      if (!guests[idx].loungerHistory) guests[idx].loungerHistory = [];

      // Add history entries
      guests[idx].loungerHistory!.push({
        date: today,
        loungerId: oldLoungerId,
        action: "relocated_from",
        reason: reason.trim(),
        timestamp: now,
        by: adminId,
      });
      guests[idx].loungerHistory!.push({
        date: today,
        loungerId: newLoungerId.trim().toUpperCase(),
        action: "relocated_to",
        reason: reason.trim(),
        timestamp: now,
        by: adminId,
      });

      // Update lounger
      guests[idx].loungerId = newLoungerId.trim().toUpperCase();
      await saveGuests(guests);
      return NextResponse.json({ success: true, data: guests[idx] });
    }

    // ── GET HISTORY (lounger history for a guest) ──
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
