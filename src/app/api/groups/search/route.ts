import { NextRequest, NextResponse } from "next/server";
import { getGuests } from "@/lib/guest-store";
import { todayRO } from "@/lib/lounger-utils";

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone");
    if (!phone?.trim()) {
      return NextResponse.json({ success: false, error: "Telefonul este obligatoriu." }, { status: 400 });
    }
    const today = todayRO();
    const guests = await getGuests();
    const group = guests.find((g) =>
      g.status !== "checked_out" &&
      g.stayStart <= today && g.stayEnd >= today &&
      (g.phone === phone.trim() || g.members?.some((m) => m.phone === phone.trim()))
    );
    if (!group) {
      return NextResponse.json({ success: false, error: "Nu s-a gasit niciun grup cu acest numar." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        groupId: group.id,
        primaryName: group.name,
        memberCount: group.members?.length || 1,
        memberNames: group.members?.map((m) => m.name.split(" ")[0]) || [group.name.split(" ")[0]],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
