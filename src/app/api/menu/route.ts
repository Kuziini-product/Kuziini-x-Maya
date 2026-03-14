import { NextRequest, NextResponse } from "next/server";
import { MOCK_MENU_ITEMS, MENU_CATEGORIES } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function GET(req: NextRequest) {
  await sleep(300);

  const { searchParams } = new URL(req.url);
  const umbrellaId = searchParams.get("umbrellaId");
  const category = searchParams.get("category");

  if (!umbrellaId) {
    return NextResponse.json(
      { success: false, error: "umbrellaId este obligatoriu." },
      { status: 400 }
    );
  }

  let items = MOCK_MENU_ITEMS;
  if (category) {
    items = items.filter((i) => i.categorySlug === category);
  }

  return NextResponse.json({
    success: true,
    data: { categories: MENU_CATEGORIES, items },
  });
}
