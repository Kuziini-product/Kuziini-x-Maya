import { NextRequest, NextResponse } from "next/server";
import { LOFT_GALLERY, KUZIINI_GALLERY, LOFT_LIBRARY, KUZIINI_LIBRARY } from "@/lib/mock-data";
import type { GalleryConfig, GalleryImage, LibraryPhoto } from "@/lib/mock-data";
import type { BannerCategory } from "@/types";

const ADMIN_PASSWORD = "Kuziini1";
const LOFT_PASSWORD = "Loft2025";

function getGallery(category: BannerCategory): GalleryConfig {
  return category === "loft" ? LOFT_GALLERY : KUZIINI_GALLERY;
}

function getLibrary(category: BannerCategory): LibraryPhoto[] {
  return category === "loft" ? LOFT_LIBRARY : KUZIINI_LIBRARY;
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

function galleryResponse(gallery: GalleryConfig, library: LibraryPhoto[]) {
  return {
    success: true,
    data: {
      slots: gallery.slots,
      images: [...gallery.images].sort((a, b) => a.order - b.order),
      library: [...library].sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
    },
  };
}

// Ensure a URL exists in the library, add if not
function ensureInLibrary(library: LibraryPhoto[], url: string, category: BannerCategory) {
  const exists = library.some((p) => p.url === url);
  if (!exists) {
    library.push({
      id: `${category[0]}l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      addedAt: new Date().toISOString(),
    });
  }
}

// GET - public (no library)
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
    action: string;
  };

  if (!category || (category !== "loft" && category !== "kuziini")) {
    return NextResponse.json({ success: false, error: "Categorie invalidă." }, { status: 400 });
  }

  if (!validatePassword(password, category)) {
    return NextResponse.json({ success: false, error: "Parolă incorectă." }, { status: 401 });
  }

  const gallery = getGallery(category);
  const library = getLibrary(category);

  switch (action) {
    case "get":
      return NextResponse.json(galleryResponse(gallery, library));

    case "setSlots": {
      const { slots } = body as { slots: number };
      if (![1, 2, 3, 4, 6].includes(slots)) {
        return NextResponse.json({ success: false, error: "Număr de ferestre invalid (1,2,3,4,6)." }, { status: 400 });
      }
      setGallery(category, { slots });
      if (gallery.images.length > slots) {
        const sorted = [...gallery.images].sort((a, b) => a.order - b.order).slice(0, slots);
        sorted.forEach((img, i) => (img.order = i));
        setGallery(category, { images: sorted });
      }
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "setSlotImage": {
      // Set image at a specific slot index (add or replace)
      const { slotIndex, url } = body as { slotIndex: number; url: string };
      if (!url) {
        return NextResponse.json({ success: false, error: "URL imagine lipsă." }, { status: 400 });
      }
      if (slotIndex < 0 || slotIndex >= gallery.slots) {
        return NextResponse.json({ success: false, error: "Index fereastră invalid." }, { status: 400 });
      }
      // Save to library
      ensureInLibrary(library, url, category);
      // Check if slot already has an image
      const sorted = [...gallery.images].sort((a, b) => a.order - b.order);
      const existing = sorted.find((img) => img.order === slotIndex);
      if (existing) {
        existing.url = url;
      } else {
        gallery.images.push({
          id: `${category[0]}g-${Date.now()}`,
          url,
          order: slotIndex,
        });
      }
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "addImage": {
      const { url } = body as { url: string };
      if (!url) {
        return NextResponse.json({ success: false, error: "URL imagine lipsă." }, { status: 400 });
      }
      if (gallery.images.length >= gallery.slots) {
        return NextResponse.json({ success: false, error: "Toate ferestrele sunt ocupate." }, { status: 400 });
      }
      ensureInLibrary(library, url, category);
      const newImg: GalleryImage = {
        id: `${category[0]}g-${Date.now()}`,
        url,
        order: gallery.images.length,
      };
      gallery.images.push(newImg);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeImage": {
      const { imageId } = body as { imageId: string };
      const filtered = gallery.images.filter((img) => img.id !== imageId);
      filtered.sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
      setGallery(category, { images: filtered });
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeSlotImage": {
      // Remove image at a specific slot index
      const { slotIndex: removeIdx } = body as { slotIndex: number };
      const filt = gallery.images.filter((img) => img.order !== removeIdx);
      // Re-index: shift down orders above removed slot
      filt.sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
      setGallery(category, { images: filt });
      return NextResponse.json(galleryResponse(gallery, library));
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
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "addToLibrary": {
      const { url: libUrl } = body as { url: string };
      if (!libUrl) {
        return NextResponse.json({ success: false, error: "URL imagine lipsă." }, { status: 400 });
      }
      ensureInLibrary(library, libUrl, category);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeFromLibrary": {
      const { photoId } = body as { photoId: string };
      const idx = library.findIndex((p) => p.id === photoId);
      if (idx !== -1) library.splice(idx, 1);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    default:
      return NextResponse.json({ success: false, error: "Acțiune invalidă." }, { status: 400 });
  }
}
