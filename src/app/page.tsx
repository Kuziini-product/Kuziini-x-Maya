"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, MapPin, Phone, Mail, AtSign, X, Send, CheckCircle, Heart, Download, Share } from "lucide-react";
import { useSessionStore } from "@/store";
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
  const router = useRouter();
  const { userSession } = useSessionStore();
  const [loftGallery, setLoftGallery] = useState<GalleryData | null>(null);
  const [kuziiniGallery, setKuziiniGallery] = useState<GalleryData | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; isKuziini: boolean } | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<Event | null>(null);

  // Detect if already running as installed PWA
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) setIsInstalled(true);
  }, []);

  // Capture beforeinstallprompt for native install
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    const installed = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  // Auto-trigger install on first user click anywhere (Chrome requires user gesture)
  useEffect(() => {
    const triggerInstall = async () => {
      const prompt = deferredPromptRef.current as (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null;
      if (!prompt) return;
      // Only auto-prompt once per browser session
      if (sessionStorage.getItem("install_prompted")) return;
      sessionStorage.setItem("install_prompted", "1");

      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          deferredPromptRef.current = null;
          setCanInstall(false);
        }
      } catch { /* prompt already used */ }
      // Remove listener after first attempt
      document.removeEventListener("click", triggerInstall, true);
    };
    document.addEventListener("click", triggerInstall, true);
    return () => document.removeEventListener("click", triggerInstall, true);
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPromptRef.current as (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null;
    if (prompt) {
      // Desktop/Android — trigger native install
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        deferredPromptRef.current = null;
        setCanInstall(false);
      }
    } else {
      // iOS/Safari — show manual instructions
      setShowInstall(true);
    }
  };

  const openLightbox = useCallback((allImages: string[], clickedIndex: number, isKuziini = false) => {
    setLightbox({ images: allImages, index: clickedIndex, isKuziini });
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
            src="/hero-bg.jpg"
            alt="LOFT Mamaia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#0A0A0A]" />
        </div>

        <div className="relative z-10 text-center px-5 w-full max-w-lg flex flex-col flex-1 pb-16 pt-8">
          {/* Logos centered between top and CTA */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* LOFT + Mamaia — tap to access LOFT admin */}
            <button onClick={() => router.push("/loft")} className="mb-6 block mx-auto">
              <img
                src="/loft-logo.png"
                alt="LOFT"
                className="h-10 object-contain mx-auto mb-1"
              />
              <p className="text-white text-sm font-light tracking-[0.5em] uppercase">
                Mamaia
              </p>
            </button>

            {/* Logo Kuziini — tap to access Kuziini admin */}
            <button onClick={() => router.push("/admin")} className="block mx-auto w-fit">
              <img
                src="/kuziini-logo.png"
                alt="Kuziini Furniture & More"
                className="w-[140px] h-auto rounded-2xl shadow-2xl shadow-black/60 border border-white/10 invert brightness-200"
              />
            </button>
          </div>

          <button
            onClick={async () => {
              // If app not installed and install prompt available, trigger install first
              if (!isInstalled && deferredPromptRef.current) {
                const p = deferredPromptRef.current as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
                try {
                  await p.prompt();
                  const { outcome } = await p.userChoice;
                  if (outcome === "accepted") {
                    deferredPromptRef.current = null;
                    setCanInstall(false);
                  }
                } catch { /* prompt already used */ }
              }
              // Then navigate
              if (userSession?.umbrellaId) {
                // Track returning user access
                fetch("/api/access-log", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "track",
                    name: userSession.name || "",
                    phone: userSession.phone || "",
                    email: userSession.email || "",
                    umbrellaId: userSession.umbrellaId,
                    page: `/u/${userSession.umbrellaId}`,
                    accessType: "menu-return",
                  }),
                }).catch(() => {});
                router.push(`/u/${userSession.umbrellaId}`);
              } else {
                router.push("/scan");
              }
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] px-8 py-3.5 font-bold text-sm tracking-[0.15em] uppercase transition-all active:opacity-80"
          >
            {userSession?.umbrellaId ? "Deschide meniul" : "Scanează QR & Comandă"}
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="mt-3 inline-flex items-center justify-center gap-2 text-white/50 text-xs tracking-[0.1em] uppercase hover:text-white/80 transition-colors py-2"
            >
              <Download className="w-3.5 h-3.5" />
              {canInstall ? "Instalează aplicația" : "Instalează aplicația"}
            </button>
          )}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* Install tooltip - positioned top-right near Safari download button */}
      {showInstall && (
        <div className="fixed inset-0 z-[9999]" onClick={() => setShowInstall(false)}>
          <div className="absolute top-2 right-3 w-[280px]" onClick={(e) => e.stopPropagation()}>
            {/* Arrow pointing up-right toward Safari bar */}
            <div className="flex justify-end pr-4 mb-[-1px]">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#1a1a1a]" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#C9AB81]/30 rounded-2xl p-5 shadow-2xl shadow-black/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-base">Instalează Kuziini</h3>
                <button onClick={() => setShowInstall(false)} className="text-white/40 hover:text-white/80">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5 text-white/80 text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span className="flex items-center gap-1.5">Apasă <Share className="w-3.5 h-3.5 text-[#C9AB81]" /> din bara Safari</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/80 text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Alege <span className="text-[#C9AB81] font-semibold">Add to Home Screen</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-white/80 text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>Apasă <span className="text-[#C9AB81] font-semibold">Add</span></span>
                </div>
              </div>

              <button
                onClick={() => setShowInstall(false)}
                className="w-full bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-[0.1em] uppercase rounded-lg"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Advertising Zone ═══ */}
      <section className="py-10 px-5 border-b border-white/5">
        <div className="max-w-md mx-auto space-y-4">
          {/* Featured Ad */}
          <div className="relative overflow-hidden border border-[#C9AB81]/20">
            <div className="bg-gradient-to-br from-[#C9AB81]/10 to-transparent p-6 text-center">
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

        {/* LOFT Gallery */}
        {loftGallery && loftGallery.images.length > 0 && (
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <img
                src="/loft-logo.png"
                alt="LOFT"
                className="h-5 object-contain opacity-60 mt-0.5 shrink-0"
              />
              <p className="text-white/40 text-sm leading-relaxed">
                — primul day party din România. 10 ani de gastronomie, băuturi craft și entertainment 360°.
              </p>
            </div>
            <ScrollableGallery
              gallery={loftGallery}
              onImageClick={(allUrls, idx) => openLightbox(allUrls, idx)}
            />
          </div>
        )}

        {/* Kuziini Gallery */}
        {kuziiniGallery && kuziiniGallery.images.length > 0 && (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-white/60 shrink-0 mt-0.5">Kuziini</span>
              <p className="text-white/40 text-sm leading-relaxed">
                — inovație, rafinament și design sofisticat. Mobilier premium, interioare personalizate.
              </p>
            </div>
            <ScrollableGallery
              gallery={kuziiniGallery}
              onImageClick={(allUrls, idx) => openLightbox(allUrls, idx, true)}
              showLikes
            />
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => router.push("/admin")}>
            <img
              src="/kuziini-logo.png"
              alt="Kuziini"
              className="w-[100px] h-auto rounded-2xl border border-white/10 invert brightness-200 object-contain"
            />
          </button>
          <span className="text-[#C9AB81]/40 text-lg font-bold">x</span>
          <button onClick={() => router.push("/loft")}>
            <img
              src="/loft-logo.png"
              alt="LOFT"
              className="h-[26px] object-contain opacity-80"
            />
          </button>
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
          <p className="text-[#0A0A0A]/70 text-[15px] text-center tracking-wider mb-1">
            &copy; 2026 Kuziini x LOFT. Toate drepturile rezervate.
          </p>
          <p className="text-[#0A0A0A] text-[15px] text-center tracking-wider font-medium">
            Kuziini Furniture Luxyri and More.
          </p>
        </div>
      </div>

      {/* Bottom black band */}
      <div className="bg-[#0A0A0A] h-6" />

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          isKuziini={lightbox.isKuziini}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function ScrollableGallery({
  gallery,
  onImageClick,
  showLikes,
}: {
  gallery: GalleryData;
  onImageClick: (allUrls: string[], idx: number) => void;
  showLikes?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allUrls = gallery.images.map((m) => m.url);
  const aspectClass = getAspectClass(gallery.aspect);
  const [photoLikes, setPhotoLikes] = useState<Record<string, { likes: number }>>({});

  useEffect(() => {
    if (!showLikes) return;
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPhotoStats", sessionId: "" }),
    })
      .then((r) => r.json())
      .then((j) => { if (j.success) setPhotoLikes(j.data); })
      .catch(() => {});
  }, [showLikes]);

  // Group images into pages based on slots
  const pages: GalleryImage[][] = [];
  for (let i = 0; i < gallery.images.length; i += gallery.slots) {
    pages.push(gallery.images.slice(i, i + gallery.slots));
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            className={`grid ${getGridCols(gallery.slots)} gap-1.5 snap-center shrink-0 w-full`}
          >
            {page.map((img, i) => {
              const globalIdx = pageIdx * gallery.slots + i;
              return (
                <div
                  key={img.id}
                  className={`relative ${aspectClass} overflow-hidden border border-white/[0.08] cursor-pointer active:opacity-80 transition-opacity`}
                  onClick={() => onImageClick(allUrls, globalIdx)}
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {showLikes && (photoLikes[`kuziini-${globalIdx}`]?.likes || 0) > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
                      <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                      <span className="text-white text-[10px] font-bold">
                        {photoLikes[`kuziini-${globalIdx}`].likes}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Dots indicator */}
      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                scrollRef.current?.children[i]?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }}
              className="w-1.5 h-1.5 rounded-full bg-white/20 hover:bg-[#C9AB81]/60 transition-colors"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  isKuziini,
  onClose,
}: {
  images: string[];
  index: number;
  isKuziini: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [likes, setLikes] = useState<Record<string, { likes: number; liked: boolean }>>({});
  const [likeAnimating, setLikeAnimating] = useState<number | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; delay: number; size: number; duration: number }[]>([]);
  const heartIdRef = useRef(0);
  const trackedViews = useRef<Set<number>>(new Set());

  // Get or create anonymous session ID
  const sessionId = useRef("");
  useEffect(() => {
    let sid = localStorage.getItem("kuziini_session");
    if (!sid) {
      sid = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("kuziini_session", sid);
    }
    sessionId.current = sid;

    // Fetch current like states
    if (isKuziini) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getPhotoStats", sessionId: sid }),
      })
        .then((r) => r.json())
        .then((j) => { if (j.success) setLikes(j.data); });
    }
  }, [isKuziini]);

  // Track photo view
  useEffect(() => {
    if (!isKuziini || !sessionId.current || trackedViews.current.has(current)) return;
    trackedViews.current.add(current);
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trackView", photoIndex: current, sessionId: sessionId.current }),
    }).catch(() => {});
  }, [current, isKuziini]);

  function spawnHearts() {
    const newHearts = Array.from({ length: 8 }, () => {
      heartIdRef.current++;
      return {
        id: heartIdRef.current,
        x: 50 + (Math.random() - 0.5) * 80, // spread horizontally around center
        delay: Math.random() * 0.4,
        size: 14 + Math.random() * 18,
        duration: 1.2 + Math.random() * 0.8,
      };
    });
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    // Clean up after animations complete
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.find((n) => n.id === h.id)));
    }, 2500);
  }

  async function toggleLike() {
    if (!sessionId.current) return;
    setLikeAnimating(current);
    setTimeout(() => setLikeAnimating(null), 600);
    // Spawn floating hearts on like (not unlike)
    const isCurrentlyLiked = likes[`kuziini-${current}`]?.liked;
    if (!isCurrentlyLiked) {
      spawnHearts();
    }
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleLike", photoIndex: current, sessionId: sessionId.current }),
      });
      const json = await res.json();
      if (json.success) {
        setLikes((prev) => ({
          ...prev,
          [`kuziini-${current}`]: { likes: json.likes, liked: json.liked },
        }));
      }
    } catch { /* ignore */ }
  }

  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kuziini_contact");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { name: parsed.name || "", phone: parsed.phone || "", email: parsed.email || "", message: "" };
        } catch { /* ignore */ }
      }
    }
    return { name: "", phone: "", email: "", message: "" };
  });

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

  async function submitOffer() {
    if (!formData.name || !formData.phone || !formData.email) {
      setFormError("Completează numele, telefonul și emailul.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      // Send selected photo indexes
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          ...formData,
          photoIndexes: Array.from(selectedPhotos).sort((a, b) => a - b),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Save contact info for next time
      localStorage.setItem("kuziini_contact", JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      }));
      setFormSent(true);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Eroare la trimitere.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
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

      {/* Main content area */}
      {showForm && !formSent ? (
        /* ── Offer form mode: gallery grid + contact form ── */
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Gallery grid for selection */}
          <div className="mb-4">
            <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
              Selectează produsele ({selectedPhotos.size} {selectedPhotos.size === 1 ? "selectat" : "selectate"})
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedPhotos((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    });
                  }}
                  className={`relative aspect-square overflow-hidden border-2 transition-all ${
                    selectedPhotos.has(i)
                      ? "border-emerald-400 opacity-100"
                      : "border-white/[0.08] opacity-60"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {selectedPhotos.has(i) && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-emerald-400 drop-shadow-lg" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded-sm">#{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div className="space-y-2">
            <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Date de contact</p>
            <input
              type="text"
              placeholder="Nume *"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              className="w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#C9AB81]/50"
            />
            <input
              type="tel"
              placeholder="Telefon *"
              value={formData.phone}
              onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
              className="w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#C9AB81]/50"
            />
            <input
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              className="w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#C9AB81]/50"
            />
            <textarea
              placeholder="Mesaj (opțional)"
              value={formData.message}
              onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
              rows={2}
              className="w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#C9AB81]/50 resize-none"
            />
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <div className="flex gap-2">
              <button
                onClick={submitOffer}
                disabled={formLoading || selectedPhotos.size === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-[0.1em] uppercase disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {formLoading ? "Se trimite..." : `Trimite (${selectedPhotos.size})`}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2.5 bg-white/[0.06] border border-white/[0.1] text-white/60 text-xs font-bold tracking-wider uppercase"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Normal lightbox mode: large photo + navigation ── */
        <>
          <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
            {current > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}

            <div className="relative">
              <img
                key={current}
                src={images[current]}
                alt=""
                className="max-w-full max-h-full object-contain animate-fade-in"
              />
              {/* Floating hearts animation */}
              {floatingHearts.length > 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {floatingHearts.map((h) => (
                    <div
                      key={h.id}
                      className="absolute"
                      style={{
                        left: `${h.x}%`,
                        bottom: 0,
                        animation: `floatHeart ${h.duration}s ease-out ${h.delay}s both`,
                      }}
                    >
                      <Heart
                        className="text-red-500 fill-red-500 drop-shadow-lg"
                        style={{
                          width: h.size,
                          height: h.size,
                          animation: `heartWiggle ${0.3 + Math.random() * 0.3}s ease-in-out ${h.delay}s infinite alternate`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {isKuziini && (
                <button
                  onClick={toggleLike}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-2 active:scale-110 transition-transform z-30"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      likes[`kuziini-${current}`]?.liked
                        ? "text-red-500 fill-red-500"
                        : "text-white/70"
                    } ${likeAnimating === current ? "animate-ping-once" : ""}`}
                  />
                  {(likes[`kuziini-${current}`]?.likes || 0) > 0 && (
                    <span className="text-white/80 text-xs font-bold">
                      {likes[`kuziini-${current}`].likes}
                    </span>
                  )}
                </button>
              )}
            </div>

            {current < images.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
            )}

            {/* CTA overlay */}
            {isKuziini && !formSent && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={() => {
                    setSelectedPhotos(new Set([current]));
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2 px-5 font-bold text-[11px] tracking-[0.1em] uppercase active:opacity-80 transition-opacity shadow-lg shadow-black/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  Solicită ofertă
                </button>
              </div>
            )}

            {/* Success message overlay */}
            {isKuziini && formSent && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[360px]">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-emerald-400 text-sm font-bold">Cererea a fost trimisă!</p>
                      <p className="text-white/40 text-xs mt-0.5">Vei fi contactat în cel mai scurt timp.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormSent(false);
                      setSelectedPhotos(new Set());
                      setShowForm(true);
                      setFormData((d) => ({ ...d, message: "" }));
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] py-2 font-bold text-xs tracking-[0.1em] uppercase active:opacity-80 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Solicită altă ofertă
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {!formSent && (
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
          )}
        </>
      )}
    </div>
  );
}
