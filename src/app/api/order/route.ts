import { NextRequest, NextResponse } from "next/server";
import { sleep, generateId } from "@/lib/utils";
import type { Order, CartItem } from "@/types";

export async function POST(req: NextRequest) {
  await sleep(500);

  const body = await req.json();

  const {
    umbrellaId,
    sessionId,
    guestPhone,
    role,
    items,
    ownerApprovalRequired = false,
  } = body as {
    umbrellaId: string;
    sessionId: string;
    guestPhone: string;
    role: "owner" | "guest";
    items: CartItem[];
    ownerApprovalRequired: boolean;
  };

  if (!umbrellaId || !sessionId || !guestPhone || !items?.length) {
    return NextResponse.json(
      { success: false, error: "Date incomplete pentru comandă." },
      { status: 400 }
    );
  }

  const subtotal = items.reduce(
    (sum: number, i: CartItem) => sum + i.menuItem.price * i.quantity,
    0
  );

  const order: Order = {
    id: `ord-${generateId()}`,
    umbrellaId,
    sessionId,
    guestPhone,
    role,
    items: items.map((i: CartItem) => ({
      menuItemId: i.menuItem.id,
      name: i.menuItem.name,
      price: i.menuItem.price,
      quantity: i.quantity,
      notes: i.notes,
    })),
    subtotal,
    total: subtotal,
    status: ownerApprovalRequired ? "pending" : "sent",
    visibility: ownerApprovalRequired ? "shared-with-owner" : "own",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerApprovalRequired,
    ownerApproved: null,
  };

  return NextResponse.json({ success: true, data: { order } });
}
