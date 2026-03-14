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
    <div className="min-h-dvh bg-black text-white overflow-x-hidden">
      {/* Hero - full screen mobile */}
      <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://loftlounge.ro/wp-content/uploads/2025/07/loft-mamaia-featured.jpg"
            alt="LOFT Mamaia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        </div>

        <div className="relative z-10 text-center px-5 w-full max-w-lg">
          {/* Logo mare */}
          <Image
            src="/kuziini-logo.jpg"
            alt="Kuziini Furniture & More"
            width={160}
            height={160}
            className="rounded-3xl shadow-2xl shadow-black/50 border-2 border-white/10 mx-auto mb-6"
          />

          {/* Brand names */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="font-display text-2xl font-bold tracking-wide">Kuziini</span>
            <span className="text-2xl font-display font-bold text-purple-400">×</span>
            <img
              src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
              alt="LOFT"
              className="h-8 object-contain"
            />
          </div>

          <p className="text-white/60 text-base font-body mb-1 italic">
            &ldquo;The best restaurant is a club,
            and the best club is a restaurant.&rdquo;
          </p>
          <p className="text-purple-300 text-xs font-body tracking-widest uppercase mb-8">
            Mamaia Nord
          </p>

          <Link
            href="/u/A-01"
            className="inline-flex items-center gap-2 bg-purple-600 active:bg-purple-700 text-white px-7 py-3.5 rounded-full font-semibold text-base transition-all shadow-lg shadow-purple-600/30"
          >
            Scanează QR & Comandă
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-14 px-5">
        <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase font-body mb-2">
          Despre noi
        </p>
        <h2 className="font-display text-2xl font-bold mb-4">
          Design <span className="text-purple-400">&</span> Lifestyle
        </h2>
        <p className="text-white/50 text-sm font-body leading-relaxed mb-4">
          <strong className="text-white/80">Kuziini</strong> — inovație, rafinament și design sofisticat.
          Mobilier premium, interioare personalizate.
        </p>
        <p className="text-white/50 text-sm font-body leading-relaxed mb-8">
          <strong className="text-white/80">LOFT</strong> — primul day party din România.
          10 ani de gastronomie, băuturi craft și entertainment 360°.
        </p>

        {/* Gallery - mobile optimized */}
        <div className="grid grid-cols-2 gap-2">
          {GALLERY_IMAGES.slice(0, 8).map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl ${
                i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-5 bg-gradient-to-b from-black to-gray-950">
        <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase font-body mb-2">
          Cum funcționează
        </p>
        <h2 className="font-display text-2xl font-bold mb-8">
          Comandă de la <span className="text-purple-400">șezlong</span>
        </h2>

        <div className="space-y-3">
          {[
            { step: "01", title: "Scanează QR", desc: "Codul QR de pe umbrela ta", icon: "📱" },
            { step: "02", title: "Alege din meniu", desc: "Meniul LOFT complet cu prețuri live", icon: "🍹" },
            { step: "03", title: "Primești comanda", desc: "Livrare la șezlong, plată cash/card/room charge", icon: "🛎️" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <span className="text-3xl shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-purple-400 text-[10px] font-bold font-body">{item.step}</span>
                  <h3 className="font-display text-base font-bold">{item.title}</h3>
                </div>
                <p className="text-white/40 text-xs font-body">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Zones */}
      <section className="py-14 px-5">
        <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase font-body mb-2">
          Demo
        </p>
        <h2 className="font-display text-2xl font-bold mb-6">
          Încearcă acum
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {ZONES.map((zone) => (
            <Link key={zone.id} href={`/u/${zone.id}`}>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 active:bg-white/10 transition-all group">
                <span className="text-xl mb-2 block">{zone.emoji}</span>
                <p className="font-bold font-body text-sm">{zone.id}</p>
                <p className="text-purple-300 text-[11px] font-body">{zone.name}</p>
                <p className="text-white/30 text-[10px] font-body mt-0.5">{zone.desc}</p>
                <ChevronRight className="w-3.5 h-3.5 text-purple-400 mt-2 group-active:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <Image
            src="/kuziini-logo.jpg"
            alt="Kuziini"
            width={48}
            height={48}
            className="rounded-xl border border-white/10"
          />
          <div>
            <h3 className="font-display text-lg font-bold">Kuziini × LOFT</h3>
            <p className="text-white/30 text-[11px] font-body">Lounge & Beach · Mamaia Nord</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-8">
          <div className="flex items-center gap-2.5 text-white/50 text-xs font-body">
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            Bd Mamaia Nord nr. 564, Mamaia
          </div>
          <div className="flex items-center gap-2.5 text-white/50 text-xs font-body">
            <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            +40 756 385 638
          </div>
          <div className="flex items-center gap-2.5 text-white/50 text-xs font-body">
            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            concierge@loftlounge.ro
          </div>
          <div className="flex items-center gap-2.5 text-white/50 text-xs font-body">
            <AtSign className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            @kuziiniconceptstore
          </div>
        </div>

        <p className="text-white/15 text-[10px] font-body text-center">
          &copy; 2026 Kuziini &times; LOFT. Toate drepturile rezervate.
        </p>
      </footer>
    </div>
  );
}
