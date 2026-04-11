"use client";

import type { BannerCategory } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import GalleryManager from "@/components/GalleryManager";
import SectionHelp from "@/components/SectionHelp";

interface GalleryData {
  slots: number;
  aspect: GalleryAspect;
  images: GalleryImage[];
  library: LibraryPhoto[];
}

interface Props {
  category: BannerCategory;
  data: GalleryData;
  onUpdate: (data: GalleryData) => void;
}

const HELP_ITEMS = [
  "Alege numarul de ferestre (1, 2, 3, 4 sau 6) pentru a seta cate poze apar pe landing page.",
  "Alege aspectul imaginii: Patrat, Portret sau Peisaj.",
  "Apasa pe o fereastra goala pentru a alege o poza din biblioteca sau apasa 'Din PC' pentru a incarca direct.",
  "Biblioteca de poze pastreaza toate pozele incarcate. Pozele sunt redimensionate automat (max 1200px).",
];

export default function GallerySection({ category, data, onUpdate }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">
          Pozele apar pe pagina de landing in sectiunea {category}
        </p>
        <SectionHelp items={HELP_ITEMS} />
      </div>
      <GalleryManager
        category={category}
        slots={data.slots}
        aspect={data.aspect}
        images={data.images}
        library={data.library}
        onUpdate={onUpdate}
      />
    </>
  );
}
