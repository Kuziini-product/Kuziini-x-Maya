"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Users,
  Check,
  AlertCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import PhoneInput from "@/components/PhoneInput";

type Step = "form" | "success";

function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");

  // Personal data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [email, setEmail] = useState("");
  const [stayDays, setStayDays] = useState(1);
  const [groupSize, setGroupSize] = useState(1);

  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Numele este obligatoriu."); return; }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Introdu un numar de telefon valid.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Introdu o adresa de email valida.");
      return;
    }

    setLoading(true);
    setError(null);
    const today = todayRO();
    const stayEnd = addDays(today, stayDays - 1);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          stayStart: today,
          stayEnd,
          groupSize,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la inregistrare.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep("form");
    setName("");
    setPhone("+40");
    setEmail("");
    setStayDays(1);
    setGroupSize(1);
    setError(null);
  }

  const inputCls =
    "w-full bg-white/[0.06] border border-white/[0.1] px-3 py-3 text-white text-sm outline-none focus:border-maya-gold/50 placeholder:text-white/30";
  const labelCls =
    "text-[10px] font-bold text-maya-gold uppercase tracking-[0.2em] mb-1.5 block";

  // ── SUCCESS SCREEN ──
  if (step === "success") {
    return (
      <div className="min-h-dvh bg-maya-dark text-white px-6 py-12">
        <div className="max-w-sm mx-auto text-center">
          <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Date trimise!</h1>
          <p className="text-white/60 text-sm mb-2">
            Receptia va valida datele tale si iti va aloca {groupSize === 1 ? "un sezlong" : `${groupSize} sezlonguri`} pe plaja.
          </p>
          <p className="text-white/40 text-xs mb-8">
            Te rugam sa astepti confirmarea de la receptie.
          </p>

          <button
            onClick={resetForm}
            className="w-full bg-white/[0.06] border border-white/[0.1] py-3 text-white/60 font-bold text-xs tracking-wider uppercase"
          >
            Inregistrare alt oaspete
          </button>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ──
  return (
    <div className="min-h-dvh bg-maya-dark text-white px-6 py-8">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/Maya.png" alt="Maya" className="h-12 object-contain" />
            <img
              src="/kuziini-logo.png"
              alt="Kuziini"
              className="h-12 object-contain invert brightness-200 rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-wide mb-1">Inregistrare</h1>
          <p className="text-white/40 text-xs">
            Completeaza datele tale pentru a accesa serviciile
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-maya-gold/10 border border-maya-gold/20 p-4 mb-6">
          <p className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            Cum functioneaza
          </p>
          <ol className="text-white/50 text-xs space-y-1.5 list-decimal list-inside">
            <li>Completeaza datele tale</li>
            <li>Selecteaza cate persoane sunteti in grup</li>
            <li>Receptia va valida si va aloca sezlongurile</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Nume complet *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Numele tau complet"
                autoFocus
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Telefon *</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="email@exemplu.com"
              />
            </div>
          </div>

          {/* Stay duration + Group size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cate zile stai?</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <select
                  value={stayDays}
                  onChange={(e) => setStayDays(Number(e.target.value))}
                  className={`${inputCls} pl-9 appearance-none`}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-[#1a1a1a]">
                      {d} {d === 1 ? "zi" : "zile"}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-white/30 text-[10px] mt-1">
                {todayRO()} → {addDays(todayRO(), stayDays - 1)}
              </p>
            </div>
            <div>
              <label className={labelCls}>Cate persoane?</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className={`${inputCls} pl-9 appearance-none`}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} className="bg-[#1a1a1a]">
                      {n} {n === 1 ? "persoana" : "persoane"}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-maya-gold/70 text-[10px] mt-1">
                Receptia va aloca {groupSize === 1 ? "un sezlong" : `${groupSize} sezlonguri`}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-maya-gold text-maya-dark py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Se trimite..." : "Trimite pentru validare"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-white/30 text-xs flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Inapoi la pagina principala
          </a>
        </div>
      </div>
    </div>
  );
}
