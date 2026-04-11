import { NextResponse } from "next/server";
import { kvGet } from "@/lib/kv";
import { ALL_UMBRELLAS } from "@/lib/umbrella-config";
import { migrateGuests } from "@/lib/migrate-guests";
import { getOccupiedLoungers, todayRO } from "@/lib/lounger-utils";
import type { GuestProfile, DailyConfirmation, DashboardStats } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

    const today = todayRO();
    const guests = migrateGuests(await kvGet<GuestProfile[]>("guests:registry", []));
    const confirmations = await kvGet<DailyConfirmation[]>(`guests:daily:${today}`, []);

    // Lounger config - 400 umbrellas from master config
    const loungerConfig = ALL_UMBRELLAS;

    const todayGuests = guests.filter(
      (g) => g.stayStart <= today && g.stayEnd >= today && g.status !== "checked_out"
    );
    const activeGuests = todayGuests.filter((g) => g.status === "active");
    const confirmedIds = new Set(confirmations.map((c) => c.guestId));
    const occupiedLoungers = getOccupiedLoungers(activeGuests, today);
    const pendingValidation = guests.filter((g) => g.status === "pending_validation").length;

    // Count persons (members) not just cards
    const countPersons = (list: typeof guests) =>
      list.reduce((sum, g) => sum + (g.members?.length || 1), 0);
    const totalPersons = countPersons(guests.filter(g => g.status !== "checked_out"));
    const totalPersonsToday = countPersons(todayGuests);
    const activePersons = countPersons(activeGuests);
    const loungersInUsePersons = countPersons(activeGuests.filter(g => (g.loungerIds?.length || 0) > 0 || g.loungerId));
    const creditPersonsCount = countPersons(todayGuests.filter(g => g.creditEnabled));

    const pendingOrders = 0;

    const stats: DashboardStats = {
      totalLoungers: loungerConfig.length,
      totalPersons,
      loungersInUse: occupiedLoungers.size,
      loungersInUsePersons,
      freeLoungers: loungerConfig.length - occupiedLoungers.size,
      activeGuests: activeGuests.length,
      activePersons,
      pendingOrders,
      totalGuestsToday: todayGuests.length,
      totalPersonsToday,
      creditGuestsCount: todayGuests.filter((g) => g.creditEnabled).length,
      creditPersonsCount,
      pendingValidation,
    };

    return NextResponse.json({ success: true, data: { stats, loungerConfig } });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
