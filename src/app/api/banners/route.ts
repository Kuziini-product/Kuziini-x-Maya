import { NextRequest, NextResponse } from "next/server";
import { LOFT_BANNERS, KUZIINI_BANNERS } from "@/lib/mock-data";
import { kvGet, kvSet } from "@/lib/kv";
import type { PromoBanner, BannerCategory } from "@/types";

const ADMIN_PASSWORD = "Kuziini1";
const LOFT_PASSWORD = "Loft2025";

async function getBanners(category: BannerCategory): Promise<PromoBanner[]> {
  const key = `banners:${category}`;
  const fallback = category === "loft" ? [...LOFT_BANNERS] : [...KUZIINI_BANNERS];
  const arr = await kvGet<PromoBanner[]>(key, fallback);
  return [...arr].sort((a, b) => a.order - b.order);
}

async function setBanners(category: BannerCategory, banners: PromoBanner[]) {
  await kvSet(`banners:${category}`, banners);
}

function validatePassword(password: string, category: BannerCategory): boolean {
  if (category === "loft") return password === LOFT_PASSWORD;
  return password === ADMIN_PASSWORD;
}

// GET - public, returns banners for display
export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get("category") || "loft") as BannerCategory;
  if (category !== "loft" && category !== "kuziini") {
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: await getBanners(category) });
}

// POST - authenticated, manage banners
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, category, action } = body as {
    password: string;
    category: BannerCategory;
    action: "list" | "add" | "update" | "delete" | "reorder";
  };

  if (!category || (category !== "loft" && category !== "kuziini")) {
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
  }

  if (!validatePassword(password, category)) {
    return NextResponse.json({ success: false, error: "Parola incorecta." }, { status: 401 });
  }

  const banners = await getBanners(category);

  switch (action) {
    case "list":
      return NextResponse.json({ success: true, data: banners });

    case "add": {
      const { title, subtitle, emoji, image, instagramUrl, menuItemId } = body as {
        title: string;
        subtitle?: string;
        emoji?: string;
        image?: string;
        instagramUrl?: string;
        menuItemId?: string;
      };
      if (!title) {
        return NextResponse.json({ success: false, error: "Titlul este obligatoriu." }, { status: 400 });
      }
      const newBanner: PromoBanner = {
        id: `${category}-${Date.now()}`,
        title,
        subtitle: subtitle || "",
        emoji: emoji || "",
        image: image || undefined,
        color: "",
        order: banners.length,
        instagramUrl: instagramUrl || undefined,
        menuItemId: menuItemId || undefined,
      };
      banners.push(newBanner);
      await setBanners(category, banners);
      return NextResponse.json({ success: true, data: banners });
    }

    case "update": {
      const { bannerId, title, subtitle, emoji, image, instagramUrl, menuItemId } = body as {
        bannerId: string;
        title?: string;
        subtitle?: string;
        emoji?: string;
        image?: string | null;
        instagramUrl?: string | null;
        menuItemId?: string | null;
      };
      const idx = banners.findIndex((b) => b.id === bannerId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Banner negasit." }, { status: 404 });
      }
      if (title !== undefined) banners[idx].title = title;
      if (subtitle !== undefined) banners[idx].subtitle = subtitle;
      if (emoji !== undefined) banners[idx].emoji = emoji;
      if (image !== undefined) banners[idx].image = image || undefined;
      if (instagramUrl !== undefined) banners[idx].instagramUrl = instagramUrl || undefined;
      if (menuItemId !== undefined) banners[idx].menuItemId = menuItemId || undefined;
      await setBanners(category, banners);
      return NextResponse.json({ success: true, data: banners });
    }

    case "delete": {
      const { bannerId } = body as { bannerId: string };
      const filtered = banners.filter((b) => b.id !== bannerId);
      filtered.forEach((b, i) => (b.order = i));
      await setBanners(category, filtered);
      return NextResponse.json({ success: true, data: filtered });
    }

    case "reorder": {
      const { orderedIds } = body as { orderedIds: string[] };
      if (!orderedIds?.length) {
        return NextResponse.json({ success: false, error: "Lista de ordine este goala." }, { status: 400 });
      }
      const reordered: PromoBanner[] = [];
      orderedIds.forEach((id, i) => {
        const banner = banners.find((b) => b.id === id);
        if (banner) {
          banner.order = i;
          reordered.push(banner);
        }
      });
      await setBanners(category, reordered);
      return NextResponse.json({ success: true, data: reordered });
    }

    default:
      return NextResponse.json({ success: false, error: "Actiune invalida." }, { status: 400 });
  }
}

