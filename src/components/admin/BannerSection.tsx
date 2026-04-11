"use client";

import type { PromoBanner, BannerCategory } from "@/types";
import BannerManager from "@/components/BannerManager";
import SectionHelp from "@/components/SectionHelp";

interface Props {
  category: BannerCategory;
  banners: PromoBanner[];
  onUpdate: (banners: PromoBanner[]) => void;
}

const HELP_ITEMS = [
  "Bannerele apar pe pagina clientului (pagina umbrelelei).",
  "Apasa 'Adauga banner' pentru a crea un banner nou. Titlul este obligatoriu.",
  "Poti adauga un emoji sau o imagine (max 500KB) pentru a face bannerul mai vizibil.",
  "Sectiunea 'Produs din meniu' iti permite sa asociezi un produs. Cand clientul apasa pe banner, produsul se adauga automat in cosul lui.",
  "Titlul bannerului poate fi diferit de numele produsului din meniu (denumire de marketing).",
  "Foloseste sagetile sus/jos pentru a schimba ordinea bannerelor.",
  "Primul banner din lista va fi afisat pe pagina clientului.",
];

export default function BannerSection({ category, banners, onUpdate }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">
          {banners.length} bannere · Apar pe pagina clientilor in sectiunea {category}
        </p>
        <SectionHelp items={HELP_ITEMS} />
      </div>
      <BannerManager category={category} banners={banners} onUpdate={onUpdate} />
    </>
  );
}
