"use client";

import { useState, useEffect, useRef } from "react";
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

  // Auto-search group when phone changes (debounce 800ms)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const digits = groupPhone.replace(/\D/g, "");
    // Need at least 10 digits (country code + number)
    if (digits.length < 10) {
      setGroupInfo(null);
      setGroupError(null);
      setSearchingGroup(false);
      return;
    }
    if (groupPhone.trim() === phone.trim()) {
      setGroupError("Nu poti introduce propriul numar de telefon.");
      setGroupInfo(null);
      return;
    }
    // Debounce
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchingGroup(true);
    setGroupError(null);
    setGroupInfo(null);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/groups/search?phone=${encodeURIComponent(groupPhone.trim())}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setGroupInfo(json.data);
        setGroupError(null);
      } catch {
        setGroupInfo(null);
        setGroupError("not_found");
      } finally {
        setSearchingGroup(false);
      }
    }, 800);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [groupPhone, phone]);

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
      const myId = json.data.id;

      // Step 2: If group found, join it automatically
      if (groupInfo) {
        await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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

          {/* ── GROUP JOIN (auto-search) ── */}
          <div className={`p-4 border-2 transition-colors ${
            groupInfo ? "bg-emerald-400/5 border-emerald-400/30" :
            groupError ? "bg-red-400/5 border-red-400/30" :
            "bg-white/[0.02] border-white/[0.08]"
          }`}>
            <p className={labelCls}>Telefon alt membru din grup (optional)</p>
            <p className="text-white/40 text-xs mb-3">
              Introdu numarul de telefon al unui membru care s-a inregistrat deja. Sistemul va gasi grupul automat.
            </p>

            <PhoneInput
              value={groupPhone}
              onChange={setGroupPhone}
              placeholder="712 345 678"
            />

            {/* Status indicator */}
            {searchingGroup && (
              <p className="text-[#C9AB81] text-xs mt-2 animate-pulse">Se cauta grupul...</p>
            )}

            {groupError && groupError !== "not_found" && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{groupError}</p>
              </div>
            )}

            {groupError === "not_found" && (
              <div className="mt-3 bg-red-400/5 border border-red-400/20 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-xs font-bold mb-1">Nu exista un grup cu acest numar.</p>
                    <p className="text-white/50 text-xs">
                      Membrul trebuie sa se inregistreze primul prin scanarea QR-ului de la receptie.
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/[0.06] pt-2">
                  <p className="text-[#C9AB81] text-xs font-bold mb-1">Esti primul din grup?</p>
                  <p className="text-white/50 text-xs">
                    Daca tu initiezi grupul, lasa acest camp gol si apasa "Trimite". Ceilalti membri vor introduce numarul TAU de telefon ({phone}) cand se inregistreaza, pentru a se alatura grupului tau.
                  </p>
                </div>
              </div>
            )}

            {groupInfo && (
              <div className="flex items-center gap-2 mt-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-emerald-400 text-sm font-bold">
                    Grup: {groupInfo.primaryName}
                  </p>
                  <p className="text-white/60 text-xs">
                    {groupInfo.memberCount} {groupInfo.memberCount === 1 ? "membru" : "membri"}: {groupInfo.memberNames.join(", ")}
                  </p>
                  <p className="text-emerald-400/70 text-[10px] mt-0.5">
                    Te vei alatura automat la trimitere
                  </p>
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
