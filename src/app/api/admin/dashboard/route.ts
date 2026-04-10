import { NextResponse } from "next/server";
import { kvGet } from "@/lib/kv";
import { ALL_UMBRELLAS } from "@/lib/umbrella-config";
import type { GuestProfile, DailyConfirmation, DashboardStats } from "@/types";

function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

    const today = todayRO();
    const guests = await kvGet<GuestProfile[]>("guests:registry", []);
    const confirmations = await kvGet<DailyConfirmation[]>(`guests:daily:${today}`, []);

    // Lounger config - 400 umbrellas from master config
    const loungerConfig = ALL_UMBRELLAS;

    const todayGuests = guests.filter(
      (g) => g.stayStart <= today && g.stayEnd >= today && g.status !== "checked_out"
    );
    const activeGuests = todayGuests.filter((g) => g.status === "active");
    const confirmedIds = new Set(confirmations.map((c) => c.guestId));
    const occupiedLoungers = new Set(activeGuests.map((g) => g.loungerId));

    // Pending orders count (from KV when real order system is integrated)
    const pendingOrders = 0;

    const stats: DashboardStats = {
      totalLoungers: loungerConfig.length,
      loungersInUse: occupiedLoungers.size,
      freeLoungers: loungerConfig.length - occupiedLoungers.size,
      activeGuests: activeGuests.length,
      pendingOrders,
      totalGuestsToday: todayGuests.length,
      creditGuestsCount: todayGuests.filter((g) => g.creditEnabled).length,
    };

    return NextResponse.json({ success: true, data: { stats, loungerConfig } });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
