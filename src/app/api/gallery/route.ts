import { NextRequest, NextResponse } from "next/server";
import { LOFT_GALLERY, KUZIINI_GALLERY, LOFT_LIBRARY, KUZIINI_LIBRARY } from "@/lib/mock-data";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import type { BannerCategory } from "@/types";
import { kvGet, kvSet } from "@/lib/kv";

const ADMIN_PASSWORD = "Kuziini1";
const LOFT_PASSWORD = "Loft2025";

interface StoredGallery {
  slots: number;
  aspect: GalleryAspect;
  images: GalleryImage[];
}

async function getGallery(category: BannerCategory): Promise<StoredGallery> {
  const key = `gallery:${category}`;
  const mem = category === "loft" ? LOFT_GALLERY : KUZIINI_GALLERY;
  const fallback: StoredGallery = {
    slots: mem.slots,
    aspect: mem.aspect,
    images: [...mem.images],
  };
  return kvGet<StoredGallery>(key, fallback);
}

async function saveGallery(category: BannerCategory, data: StoredGallery) {
  await kvSet(`gallery:${category}`, data);
}

async function getLibrary(category: BannerCategory): Promise<LibraryPhoto[]> {
  const key = `library:${category}`;
  const fallback = category === "loft" ? [...LOFT_LIBRARY] : [...KUZIINI_LIBRARY];
  return kvGet<LibraryPhoto[]>(key, fallback);
}

async function saveLibrary(category: BannerCategory, library: LibraryPhoto[]) {
  await kvSet(`library:${category}`, library);
}

function validatePassword(password: string, category: BannerCategory): boolean {
  if (category === "loft") return password === LOFT_PASSWORD;
  return password === ADMIN_PASSWORD;
}

function galleryResponse(gallery: StoredGallery, library: LibraryPhoto[]) {
  return {
    success: true,
    data: {
      slots: gallery.slots,
      aspect: gallery.aspect,
      images: [...gallery.images].sort((a, b) => a.order - b.order),
      library: [...library].sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
    },
  };
}

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
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
  }
  const gallery = await getGallery(category);
  return NextResponse.json({
    success: true,
    data: {
      slots: gallery.slots,
      aspect: gallery.aspect,
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
    return NextResponse.json({ success: false, error: "Categorie invalida." }, { status: 400 });
  }

  if (!validatePassword(password, category)) {
    return NextResponse.json({ success: false, error: "Parola incorecta." }, { status: 401 });
  }

  const gallery = await getGallery(category);
  const library = await getLibrary(category);

  switch (action) {
    case "get":
      return NextResponse.json(galleryResponse(gallery, library));

    case "setSlots": {
      const { slots } = body as { slots: number };
      if (![1, 2, 3, 4, 6].includes(slots)) {
        return NextResponse.json({ success: false, error: "Numar de ferestre invalid (1,2,3,4,6)." }, { status: 400 });
      }
      gallery.slots = slots;
      // Slots now only controls how many images show per scroll page, no trimming
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "setSlotImage": {
      const { slotIndex, url } = body as { slotIndex: number; url: string };
      if (!url) {
        return NextResponse.json({ success: false, error: "URL imagine lipsa." }, { status: 400 });
      }
      if (slotIndex < 0 || slotIndex >= 12) {
        return NextResponse.json({ success: false, error: "Index fereastra invalid (max 12)." }, { status: 400 });
      }
      ensureInLibrary(library, url, category);
      await saveLibrary(category, library);
      const existing = gallery.images.find((img) => img.order === slotIndex);
      if (existing) {
        existing.url = url;
      } else {
        gallery.images.push({
          id: `${category[0]}g-${Date.now()}`,
          url,
          order: slotIndex,
        });
      }
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "addImage": {
      const { url } = body as { url: string };
      if (!url) {
        return NextResponse.json({ success: false, error: "URL imagine lipsa." }, { status: 400 });
      }
      if (gallery.images.length >= 12) {
        return NextResponse.json({ success: false, error: "Maxim 12 poze în galerie." }, { status: 400 });
      }
      ensureInLibrary(library, url, category);
      await saveLibrary(category, library);
      const newImg: GalleryImage = {
        id: `${category[0]}g-${Date.now()}`,
        url,
        order: gallery.images.length,
      };
      gallery.images.push(newImg);
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeImage": {
      const { imageId } = body as { imageId: string };
      gallery.images = gallery.images.filter((img) => img.id !== imageId);
      gallery.images.sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeSlotImage": {
      const { slotIndex: removeIdx } = body as { slotIndex: number };
      gallery.images = gallery.images.filter((img) => img.order !== removeIdx);
      gallery.images.sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
      await saveGallery(category, gallery);
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
      gallery.images = reordered;
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "setAspect": {
      const { aspect } = body as { aspect: string };
      if (!["square", "portrait", "landscape"].includes(aspect)) {
        return NextResponse.json({ success: false, error: "Aspect invalid." }, { status: 400 });
      }
      gallery.aspect = aspect as GalleryAspect;
      await saveGallery(category, gallery);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "addToLibrary": {
      const { url: libUrl } = body as { url: string };
      if (!libUrl) {
        return NextResponse.json({ success: false, error: "URL imagine lipsa." }, { status: 400 });
      }
      ensureInLibrary(library, libUrl, category);
      await saveLibrary(category, library);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    case "removeFromLibrary": {
      const { photoId } = body as { photoId: string };
      const idx = library.findIndex((p) => p.id === photoId);
      if (idx !== -1) library.splice(idx, 1);
      await saveLibrary(category, library);
      return NextResponse.json(galleryResponse(gallery, library));
    }

    default:
      return NextResponse.json({ success: false, error: "Actiune invalida." }, { status: 400 });
  }
}
