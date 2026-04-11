import { NextRequest, NextResponse } from "next/server";
import { Maya_BANNERS, KUZIINI_BANNERS } from "@/lib/mock-data";
import { kvGet, kvSet } from "@/lib/kv";
import { requireAuth, AuthError } from "@/lib/auth";
import type { PromoBanner, BannerCategory } from "@/types";

async function getBanners(category: BannerCategory): Promise<PromoBanner[]> {
  const key = `banners:${category}`;
  const fallback = category === "Maya" ? [...Maya_BANNERS] : [...KUZIINI_BANNERS];
  const arr = await kvGet<PromoBanner[]>(key, fallback);
  return [...arr].sort((a, b) => a.order - b.order);
}

async function setBanners(category: BannerCategory, banners: PromoBanner[]) {
  await kvSet(`banners:${category}`, banners);
}

// GET - public, returns banners for display
export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get("category") || "Maya") as BannerCategory;
  if (category !== "Maya" && category !== "kuziini") {
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: await getBanners(category) });
}

// POST - authenticated via session cookie
export async function POST(req: NextRequest) {
  try {
    await requireAuth(["super_admin", "content_admin"]);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
  }

  const body = await req.json();
  const { category, action } = body as {
    category: BannerCategory;
    action: "list" | "add" | "update" | "delete" | "reorder";
  };

  if (!category || (category !== "Maya" && category !== "kuziini")) {
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
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

