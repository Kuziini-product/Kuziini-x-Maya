import { NextRequest, NextResponse } from "next/server";
import { LOFT_GALLERY, KUZIINI_GALLERY } from "@/lib/mock-data";
import type { GalleryConfig, GalleryImage } from "@/lib/mock-data";
import type { BannerCategory } from "@/types";

const ADMIN_PASSWORD = "Kuziini1";
const LOFT_PASSWORD = "Loft2025";

function getGallery(category: BannerCategory): GalleryConfig {
  return category === "loft" ? LOFT_GALLERY : KUZIINI_GALLERY;
}

function setGallery(category: BannerCategory, config: Partial<GalleryConfig>) {
  const target = category === "loft" ? LOFT_GALLERY : KUZIINI_GALLERY;
  if (config.slots !== undefined) target.slots = config.slots;
  if (config.images !== undefined) {
    target.images.length = 0;
    config.images.forEach((img) => target.images.push(img));
  }
}

function validatePassword(password: string, category: BannerCategory): boolean {
  if (category === "loft") return password === LOFT_PASSWORD;
  return password === ADMIN_PASSWORD;
}

// GET - public
export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get("category") || "loft") as BannerCategory;
  if (category !== "loft" && category !== "kuziini") {
    return NextResponse.json({ success: false, error: "Categorie invalidă." }, { status: 400 });
  }
  const gallery = getGallery(category);
  return NextResponse.json({
    success: true,
    data: {
      slots: gallery.slots,
      images: [...gallery.images].sort((a, b) => a.order - b.order),
    },
  });
}

// POST - authenticated
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, category, action } = body as {
    password: string;
    category: BannerCategory;
    action: "get" | "setSlots" | "addImage" | "removeImage" | "reorderImages";
  };

  if (!category || (category !== "loft" && category !== "kuziini")) {
    return NextResponse.json({ success: false, error: "Categorie invalidă." }, { status: 400 });
  }

  if (!validatePassword(password, category)) {
    return NextResponse.json({ success: false, error: "Parolă incorectă." }, { status: 401 });
  }

  const gallery = getGallery(category);

  switch (action) {
    case "get":
      return NextResponse.json({
        success: true,
        data: {
          slots: gallery.slots,
          images: [...gallery.images].sort((a, b) => a.order - b.order),
        },
      });

    case "setSlots": {
      const { slots } = body as { slots: number };
      if (![1, 2, 3, 4, 6].includes(slots)) {
        return NextResponse.json({ success: false, error: "Număr de ferestre invalid (1,2,3,4,6)." }, { status: 400 });
      }
      setGallery(category, { slots });
      // Trim images if more than slots
      if (gallery.images.length > slots) {
        const sorted = [...gallery.images].sort((a, b) => a.order - b.order).slice(0, slots);
        sorted.forEach((img, i) => (img.order = i));
        setGallery(category, { images: sorted });
      }
      return NextResponse.json({
        success: true,
        data: {
          slots: gallery.slots,
          images: [...gallery.images].sort((a, b) => a.order - b.order),
        },
      });
    }

    case "addImage": {
      const { url } = body as { url: string };
      if (!url) {
        return NextResponse.json({ success: false, error: "URL imagine lipsă." }, { status: 400 });
      }
      if (gallery.images.length >= gallery.slots) {
        return NextResponse.json({ success: false, error: "Toate ferestrele sunt ocupate." }, { status: 400 });
      }
      const newImg: GalleryImage = {
        id: `${category[0]}g-${Date.now()}`,
        url,
        order: gallery.images.length,
      };
      gallery.images.push(newImg);
      return NextResponse.json({
        success: true,
        data: {
          slots: gallery.slots,
          images: [...gallery.images].sort((a, b) => a.order - b.order),
        },
      });
    }

    case "removeImage": {
      const { imageId } = body as { imageId: string };
      const filtered = gallery.images.filter((img) => img.id !== imageId);
      filtered.sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
      setGallery(category, { images: filtered });
      return NextResponse.json({
        success: true,
        data: {
          slots: gallery.slots,
          images: [...gallery.images].sort((a, b) => a.order - b.order),
        },
      });
    }

    case "reorderImages": {
      const { orderedIds } = body as { orderedIds: string[] };
      const reordered: GalleryImage[] = [];
      orderedIds.forEach((id, i) => {
        const img = gallery.images.find((m) => m.id === id);
        if (img) {
          img.order = i;
          reordered.push(img);
        }
      });
      setGallery(category, { images: reordered });
      return NextResponse.json({
        success: true,
        data: {
          slots: gallery.slots,
          images: [...gallery.images].sort((a, b) => a.order - b.order),
        },
      });
    }

    default:
      return NextResponse.json({ success: false, error: "Acțiune invalidă." }, { status: 400 });
  }
}
