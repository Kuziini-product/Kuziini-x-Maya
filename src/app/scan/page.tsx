"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, Mail, ArrowLeft } from "lucide-react";
import { useSessionStore } from "@/store";
import Link from "next/link";

const DEFAULT_UMBRELLA = "VIP-03";

export default function ScanPage() {
  const router = useRouter();
  const { userSession, setUserSession } = useSessionStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userSession?.umbrellaId) {
      router.push(`/u/${userSession.umbrellaId}`);
      return;
    }
    // Auto-fill from previously saved contact data
    try {
      const saved = localStorage.getItem("kuziini_contact");
      if (saved) {
        const { name: n, phone: p, email: e } = JSON.parse(saved);
        if (n) setName(n);
        if (p) setPhone(p);
        if (e) setEmail(e);
      }
    } catch {}
  }, [userSession, router]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Introdu numele tău.");
      return;
    }
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 10) {
      setError("Introdu un număr de telefon valid.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Introdu o adresă de email validă.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umbrellaId: DEFAULT_UMBRELLA,
          phone: cleaned,
          name: trimmedName,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setUserSession({
        phone: json.data.phone,
        name: trimmedName,
        email: trimmedEmail,
        role: json.data.role,
        sessionId: json.data.sessionId,
        umbrellaId: json.data.umbrellaId,
        homeUmbrellaId: json.data.homeUmbrellaId || undefined,
        isRegistered: json.data.isRegistered ?? true,
        joinedAt: json.data.joinedAt,
      });

      localStorage.setItem("kuziini_contact", JSON.stringify({
        name: trimmedName,
        phone: cleaned,
        email: trimmedEmail,
      }));

      fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "track",
          name: trimmedName,
          phone: cleaned,
          email: trimmedEmail,
          umbrellaId: DEFAULT_UMBRELLA,
          page: `/u/${DEFAULT_UMBRELLA}`,
          accessType: "register",
        }),
      }).catch(() => {});

      router.push(`/u/${json.data.umbrellaId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la înregistrare.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center bg-white/10 mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 bg-[#C9AB81]" />
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.3em] uppercase">
            Identificare
          </p>
        </div>
        <h1 className="text-2xl font-bold tracking-wide">
          Bine ai venit!
        </h1>
        <p className="text-white/40 text-xs mt-1">
          Introdu datele tale pentru a comanda
        </p>
      </div>

      <div className="flex-1 px-5 pb-8">
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
              Nume
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
              <User className="w-4 h-4 text-white/30 shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
                placeholder="Numele tău"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
              Telefon
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
              <Phone className="w-4 h-4 text-white/30 shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
                placeholder="+40 7XX XXX XXX"
                inputMode="tel"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
              Email
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
              <Mail className="w-4 h-4 text-white/30 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
                placeholder="email@exemplu.com"
                inputMode="email"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          <p className="text-white/20 text-[10px] leading-relaxed">
            Datele tale vor fi folosite pentru a primi oferte personalizate.
          </p>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Se procesează..." : "Intră în meniu"}
          </button>
        </div>
      </div>
    </div>
  );
}
