import { NextResponse } from "next/server";
import { getGuests, saveGuests } from "@/lib/guest-store";

export async function POST(req: Request) {
  try {
    const { guestId, targetGroupId } = await req.json();
    if (!guestId || !targetGroupId) {
      return NextResponse.json({ success: false, error: "Date incomplete." }, { status: 400 });
    }
    const guests = await getGuests();
    const selfIdx = guests.findIndex((g) => g.id === guestId);
    const groupIdx = guests.findIndex((g) => g.id === targetGroupId);
    if (selfIdx === -1) return NextResponse.json({ success: false, error: "Profilul tau nu a fost gasit." }, { status: 404 });
    if (groupIdx === -1) return NextResponse.json({ success: false, error: "Grupul nu a fost gasit." }, { status: 404 });
    const self = guests[selfIdx];
    if (!guests[groupIdx].members) guests[groupIdx].members = [];
    const alreadyInGroup = guests[groupIdx].members.some((m) => m.phone === self.phone);
    if (!alreadyInGroup) {
      guests[groupIdx].members.push({ phone: self.phone, name: self.name, email: self.email });
    }
    guests.splice(selfIdx, 1);
    await saveGuests(guests);
    const updatedGroupIdx = guests.findIndex((g) => g.id === targetGroupId);
    return NextResponse.json({
      success: true,
      data: { groupId: targetGroupId, memberCount: guests[updatedGroupIdx]?.members?.length || 1 },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
