"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, Phone, Mail, AtSign } from "lucide-react";

const GALLERY_IMAGES = [
  "https://loftlounge.ro/wp-content/uploads/2025/07/loft-mamaia-featured.jpg",
  "https://kuziini.ro/wp-content/uploads/2025/02/IMG-20240403-WA0019.jpg",
  "https://loftlounge.ro/wp-content/uploads/2025/07/loft-mamaia-1-1024x684.jpg",
  "https://kuziini.ro/wp-content/uploads/2025/02/aqua-marina-1.jpg",
  "https://loftlounge.ro/wp-content/uploads/2025/07/loft-mamaia-3-1024x684.jpg",
  "https://kuziini.ro/wp-content/uploads/2025/02/Classic-Grace-1.jpg",
  "https://kuziini.ro/wp-content/uploads/2025/03/orchid-oasis-2.jpg",
  "https://kuziini.ro/wp-content/uploads/2023/04/moderno-3013786877.jpg",
  "https://kuziini.ro/wp-content/uploads/2023/04/moderno-2847464326.jpg",
];

const ZONES = [
  { id: "A-01", name: "Zona Lounge", desc: "Fotolii premium", emoji: "🛋️" },
  { id: "A-02", name: "Zona Lounge", desc: "Atmosfera relaxata", emoji: "🛋️" },
  { id: "B-07", name: "Zona Beach", desc: "Plaja & mare", emoji: "🏖️" },
  { id: "VIP-03", name: "VIP Premium", desc: "Servicii exclusive", emoji: "👑" },
];

export default function HomePage() {
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
            href="/u/A-01"
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

        {/* Gallery */}
        <div className="grid grid-cols-2 gap-1.5">
          {GALLERY_IMAGES.slice(0, 8).map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${
                i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-5 border-t border-white/5">
        <div className="text-center mb-10">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.4em] uppercase mb-3">
            Cum funcționează
          </p>
          <h2 className="text-2xl font-bold tracking-wide">
            Comandă de la <span className="text-[#C9AB81]">șezlong</span>
          </h2>
          <div className="w-12 h-px bg-[#C9AB81]/40 mx-auto mt-3" />
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {[
            { step: "01", title: "Scanează QR", desc: "Codul QR de pe umbrela ta", icon: "📱" },
            { step: "02", title: "Alege din meniu", desc: "Meniul LOFT complet cu prețuri live", icon: "🍹" },
            { step: "03", title: "Primești comanda", desc: "Livrare la șezlong, plată cash/card/room charge", icon: "🛎️" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] p-4"
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[#C9AB81] text-[10px] font-bold tracking-wider">{item.step}</span>
                  <h3 className="text-sm font-bold tracking-wide">{item.title}</h3>
                </div>
                <p className="text-white/30 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Zones */}
      <section className="py-16 px-5 border-t border-white/5">
        <div className="text-center mb-8">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.4em] uppercase mb-3">
            Demo
          </p>
          <h2 className="text-2xl font-bold tracking-wide">
            Încearcă acum
          </h2>
          <div className="w-12 h-px bg-[#C9AB81]/40 mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          {ZONES.map((zone) => (
            <Link key={zone.id} href={`/u/${zone.id}`}>
              <div className="bg-white/[0.03] border border-white/[0.06] p-4 active:bg-white/[0.06] transition-all group text-center">
                <span className="text-xl mb-2 block">{zone.emoji}</span>
                <p className="font-bold text-sm tracking-wide">{zone.id}</p>
                <p className="text-[#C9AB81] text-[10px] tracking-wider uppercase">{zone.name}</p>
                <p className="text-white/20 text-[10px] mt-0.5">{zone.desc}</p>
                <ChevronRight className="w-3.5 h-3.5 text-[#C9AB81]/50 mt-2 mx-auto group-active:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-4 mb-6">
          <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/kuziini-logo.png"
              alt="Kuziini"
              width={44}
              height={44}
              className="rounded-lg border border-white/10 invert brightness-200"
            />
          </a>
          <span className="text-[#C9AB81] font-bold">×</span>
          <img
            src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
            alt="LOFT"
            className="h-6 object-contain"
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

        <p className="text-white/10 text-[10px] text-center tracking-wider">
          &copy; 2026 Kuziini &times; LOFT. Toate drepturile rezervate.
        </p>
      </footer>
    </div>
  );
}
