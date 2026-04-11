import { NextResponse } from "next/server";
import { getGuests } from "@/lib/guest-store";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["super_admin", "guest_admin"]);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
  }
  try {
    const guests = await getGuests();
    const pending = guests.filter((g) => g.status === "pending_validation");
    return NextResponse.json({ success: true, data: pending });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
