import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
    const guests = await getGuests();
    let count = 0;
    for (const g of guests) {
      if (g.status === "active") { g.status = "inactive"; count++; }
    }
    await saveGuests(guests);
    return NextResponse.json({ success: true, data: { deactivated: count } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
