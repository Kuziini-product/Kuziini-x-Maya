"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, MapPin, Phone, Mail, AtSign, X } from "lucide-react";
import type { GalleryImage, GalleryAspect } from "@/lib/mock-data";

interface GalleryData {
  slots: number;
  aspect: GalleryAspect;
  images: GalleryImage[];
}

function getGridCols(slots: number): string {
  switch (slots) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-2";
    case 3: return "grid-cols-3";
    case 4: return "grid-cols-2";
    case 6: return "grid-cols-3";
    default: return "grid-cols-2";
  }
}

function getAspectClass(aspect: GalleryAspect): string {
  switch (aspect) {
    case "portrait": return "aspect-[3/4]";
    case "landscape": return "aspect-[4/3]";
    default: return "aspect-square";
  }
}

export default function HomePage() {
  const [loftGallery, setLoftGallery] = useState<GalleryData | null>(null);
  const [kuziiniGallery, setKuziiniGallery] = useState<GalleryData | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const openLightbox = useCallback((allImages: string[], clickedIndex: number) => {
    setLightbox({ images: allImages, index: clickedIndex });
  }, []);

  useEffect(() => {
    fetch("/api/gallery?category=loft")
      .then((r) => r.json())
      .then((j) => { if (j.success) setLoftGallery(j.data); });
    fetch("/api/gallery?category=kuziini")
      .then((r) => r.json())
      .then((j) => { if (j.success) setKuziiniGallery(j.data); });
  }, []);
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Hero - full screen mobile */}
      <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://loftlounge.ro/wp-content/uploads/2025/07/loft-mamaia-featured.jpg"
            alt="LOFT Mamaia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0A0A0A]" />
        </div>

        <div className="relative z-10 text-center px-5 w-full max-w-lg">
          {/* Logo Kuziini */}
          <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer" className="block mx-auto mb-8 w-fit">
            <Image
              src="/kuziini-logo.png"
              alt="Kuziini Furniture & More"
              width={140}
              height={140}
              className="rounded-2xl shadow-2xl shadow-black/60 border border-white/10 invert brightness-200"
            />
          </a>

          {/* Brand names */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="text-xl font-bold tracking-[0.2em] uppercase">Kuziini</span>
            <span className="text-xl font-bold text-[#C9AB81]">×</span>
            <img
              src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
              alt="LOFT"
              className="h-7 object-contain"
            />
          </div>

          <p className="text-white/40 text-xs mb-1 italic tracking-wide">
            &ldquo;The best restaurant is a club,
            and the best club is a restaurant.&rdquo;
          </p>
          <p className="text-[#C9AB81] text-[10px] tracking-[0.4em] uppercase mb-10">
            Mamaia Nord
          </p>

          <Link
            href="/scan"
            className="inline-flex items-center gap-2 bg-[#C9AB81] text-[#0A0A0A] px-8 py-3.5 font-bold text-sm tracking-[0.15em] uppercase transition-all active:opacity-80"
          >
            Scanează QR & Comandă
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ═══ Advertising Zone ═══ */}
      <section className="py-10 px-5 border-b border-white/5">
        <div className="max-w-md mx-auto space-y-4">
          {/* Featured Ad */}
          <div className="relative overflow-hidden border border-[#C9AB81]/20">
            <div className="bg-gradient-to-br from-[#C9AB81]/10 to-transparent p-6">
              <p className="text-[10px] font-bold text-[#C9AB81]/60 tracking-[0.3em] uppercase mb-2">
                Sponsor
              </p>
              <h3 className="text-xl font-bold text-white tracking-wide mb-2">
                Kuziini Furniture & More
              </h3>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                Mobilier premium pentru terase, restaurante și beach clubs.
                Design italian, calitate germană.
              </p>
              <a
                href="https://www.instagram.com/kuziiniconceptstore/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#C9AB81] text-[#0A0A0A] px-5 py-2.5 font-bold text-[10px] tracking-[0.15em] uppercase active:opacity-80 transition-opacity"
              >
                Descoperă colecția
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Ad slots - 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <p className="text-[10px] text-[#C9AB81]/40 tracking-[0.2em] uppercase mb-2">Ad Space</p>
              <p className="text-white/20 text-[10px]">Spațiu publicitar disponibil</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <p className="text-[10px] text-[#C9AB81]/40 tracking-[0.2em] uppercase mb-2">Ad Space</p>
              <p className="text-white/20 text-[10px]">Spațiu publicitar disponibil</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-5">
        <div className="text-center mb-10">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.4em] uppercase mb-3">
            Despre noi
          </p>
          <h2 className="text-2xl font-bold tracking-wide mb-1">
            Design <span className="text-[#C9AB81]">&</span> Lifestyle
          </h2>
          <div className="w-12 h-px bg-[#C9AB81]/40 mx-auto mt-3" />
        </div>

        <div className="max-w-md mx-auto text-center mb-10">
          <p className="text-white/40 text-sm leading-relaxed mb-4">
            <strong className="text-white/70">Kuziini</strong> — inovație, rafinament și design sofisticat.
            Mobilier premium, interioare personalizate.
          </p>
          <p className="text-white/40 text-sm leading-relaxed">
            <strong className="text-white/70">LOFT</strong> — primul day party din România.
            10 ani de gastronomie, băuturi craft și entertainment 360°.
          </p>
        </div>

        {/* LOFT Gallery */}
        {loftGallery && loftGallery.images.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
                alt="LOFT"
                className="h-5 object-contain opacity-60"
              />
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className={`grid ${getGridCols(loftGallery.slots)} gap-1.5`}>
              {loftGallery.images.slice(0, loftGallery.slots).map((img, i) => (
                <div
                  key={img.id}
                  className={`relative ${getAspectClass(loftGallery.aspect)} overflow-hidden border border-white/[0.08] cursor-pointer active:opacity-80 transition-opacity`}
                  onClick={() => openLightbox(loftGallery.images.map((m) => m.url), i)}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kuziini Gallery */}
        {kuziiniGallery && kuziiniGallery.images.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-white/60">Kuziini</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className={`grid ${getGridCols(kuziiniGallery.slots)} gap-1.5`}>
              {kuziiniGallery.images.slice(0, kuziiniGallery.slots).map((img, i) => (
                <div
                  key={img.id}
                  className={`relative ${getAspectClass(kuziiniGallery.aspect)} overflow-hidden border border-white/[0.08] cursor-pointer active:opacity-80 transition-opacity`}
                  onClick={() => openLightbox(kuziiniGallery.images.map((m) => m.url), i)}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-4 mb-6">
          <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/kuziini-logo.png"
              alt="Kuziini"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg border border-white/10 invert brightness-200"
            />
          </a>
          <span className="text-[#C9AB81]/40 text-lg font-bold">×</span>
          <img
            src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
            alt="LOFT"
            className="h-10 object-contain opacity-80"
          />
        </div>

        <div className="space-y-2.5 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <MapPin className="w-3 h-3 text-[#C9AB81]/60 shrink-0" />
            Bd Mamaia Nord nr. 564, Mamaia
          </div>
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <Phone className="w-3 h-3 text-[#C9AB81]/60 shrink-0" />
            +40 756 385 638
          </div>
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <Mail className="w-3 h-3 text-[#C9AB81]/60 shrink-0" />
            concierge@loftlounge.ro
          </div>
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <AtSign className="w-3 h-3 text-[#C9AB81]/60 shrink-0" />
            @kuziiniconceptstore
          </div>
        </div>

      </footer>

      {/* Credit bar - white background */}
      <div className="border-t-2 border-[#C9AB81]/30">
        <div className="bg-white py-5 px-5">
          <p className="text-[#0A0A0A]/70 text-[10px] text-center tracking-wider mb-1">
            &copy; 2026 Kuziini &times; LOFT. Toate drepturile rezervate.
          </p>
          <p className="text-[#0A0A0A] text-[10px] text-center tracking-wider font-medium">
            Dezvoltat de Kuziini Furniture Luxuri and More.
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setCurrent((c) => (c < images.length - 1 ? c + 1 : c));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c > 0 ? c - 1 : c));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    // Only handle horizontal swipes (not vertical scroll)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-white/40 text-xs font-bold tracking-wider">
          {current + 1} / {images.length}
        </p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
        {/* Previous button */}
        {current > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
        )}

        <img
          key={current}
          src={images[current]}
          alt=""
          className="max-w-full max-h-full object-contain animate-fade-in"
        />

        {/* Next button */}
        {current < images.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-white/70" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 justify-center">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-12 h-12 shrink-0 overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-[#C9AB81] opacity-100"
                  : "border-transparent opacity-40"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
