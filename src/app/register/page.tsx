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

interface GroupInfo {
  groupId: string;
  primaryName: string;
  memberCount: number;
  memberNames: string[];
}

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

  // Group joining (before submit)
  const [groupPhone, setGroupPhone] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [searchingGroup, setSearchingGroup] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchGroup() {
    if (!groupPhone.trim() || groupPhone.trim().length < 5) {
      setGroupError("Introdu un numar de telefon valid.");
      return;
    }
    if (groupPhone.trim() === phone.trim()) {
      setGroupError("Nu poti introduce propriul numar de telefon.");
      return;
    }
    setSearchingGroup(true);
    setGroupError(null);
    setGroupInfo(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find-group", phone: groupPhone.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setGroupInfo(json.data);
    } catch (err: unknown) {
      setGroupError(err instanceof Error ? err.message : "Nu s-a gasit niciun membru cu acest numar. Asigura-te ca membrul s-a inregistrat deja.");
    } finally {
      setSearchingGroup(false);
    }
  }

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
      // Step 1: Self-register
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "self-register",
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
      const myId = json.data.id;

      // Step 2: If group found, join it automatically
      if (groupInfo) {
        await fetch("/api/admin/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join-group",
            guestId: myId,
            targetGroupId: groupInfo.groupId,
          }),
        });
      }

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
    setGroupPhone("");
    setGroupInfo(null);
    setGroupError(null);
    setError(null);
  }

  const inputCls =
    "w-full bg-white/[0.06] border border-white/[0.1] px-3 py-3 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/30";
  const labelCls =
    "text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block";

  // ── SUCCESS SCREEN ──
  if (step === "success") {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] text-white px-6 py-12">
        <div className="max-w-sm mx-auto text-center">
          <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Date trimise!</h1>
          <p className="text-white/60 text-sm mb-2">
            Receptia va valida datele tale si iti va aloca un loc pe plaja.
          </p>
          {groupInfo && (
            <p className="text-emerald-400 text-sm mb-2">
              Te-ai alaturat grupului lui {groupInfo.primaryName}.
            </p>
          )}
          {groupSize > 1 && !groupInfo && (
            <p className="text-[#C9AB81] text-sm mb-2">
              Grup de {groupSize} persoane. Ceilalti membri trebuie sa scaneze QR-ul si sa introduca numarul tau de telefon ({phone}) pentru a se alatura grupului.
            </p>
          )}
          <p className="text-white/40 text-xs mb-8">
            Te rugam sa astepti confirmarea de la receptie.
          </p>

          <button
            onClick={resetForm}
            className="w-full bg-white/[0.06] border border-white/[0.1] py-3 text-white/60 font-bold text-xs tracking-wider uppercase"
          >
            Inregistrare alt membru
          </button>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ──
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white px-6 py-8">
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
        <div className="bg-[#C9AB81]/10 border border-[#C9AB81]/20 p-4 mb-6">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            Cum functioneaza
          </p>
          <ol className="text-white/50 text-xs space-y-1.5 list-decimal list-inside">
            <li>Fiecare membru completeaza datele individual</li>
            <li>Pentru a forma un grup, introdu telefonul unui membru deja inregistrat</li>
            <li>Receptia va valida grupul si va aloca locurile</li>
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
            <PhoneInput
              value={phone}
              onChange={setPhone}
              autoFocus={false}
            />
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
              <label className={labelCls}>Membri in grup</label>
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
              {groupSize > 1 && (
                <p className="text-[#C9AB81] text-[10px] mt-1">
                  Fiecare membru trebuie sa scaneze QR-ul
                </p>
              )}
            </div>
          </div>

          {/* ── GROUP JOIN (before submit) ── */}
          <div className="bg-white/[0.03] border border-white/[0.08] p-4">
            <p className={labelCls}>Faci parte dintr-un grup? (optional)</p>
            <p className="text-white/40 text-xs mb-3">
              Daca un alt membru al familiei/grupului s-a inregistrat deja, introdu numarul lui de telefon pentru a va uni intr-un grup.
            </p>

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <PhoneInput
                  value={groupPhone}
                  onChange={(v) => { setGroupPhone(v); setGroupInfo(null); setGroupError(null); }}
                  placeholder="712 345 678"
                />
              </div>
              <button
                type="button"
                onClick={searchGroup}
                disabled={searchingGroup || groupPhone.replace(/\D/g, "").length < 5}
                className="px-4 py-3 bg-[#C9AB81] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase disabled:opacity-50 shrink-0"
              >
                {searchingGroup ? "..." : "Cauta"}
              </button>
            </div>

            {groupError && <p className="text-red-400 text-xs mt-2">{groupError}</p>}

            {groupInfo && (
              <div className="bg-emerald-400/10 border border-emerald-400/20 p-3 mt-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-400 text-sm font-bold">Grup gasit!</p>
                    <p className="text-white/60 text-xs">
                      {groupInfo.primaryName} · {groupInfo.memberCount} {groupInfo.memberCount === 1 ? "membru" : "membri"} ({groupInfo.memberNames.join(", ")})
                    </p>
                    <p className="text-emerald-400/70 text-[10px] mt-1">
                      Te vei alatura automat la trimitere
                    </p>
                  </div>
                </div>
              </div>
            )}
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
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Se trimite..." : groupInfo ? "Trimite si alatura-te grupului" : "Trimite pentru validare"}
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
