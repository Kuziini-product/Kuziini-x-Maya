"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  Search,
  Check,
  AlertCircle,
  ArrowLeft,
  UserPlus,
} from "lucide-react";

type Step = "form" | "success";

interface GroupInfo {
  groupId: string;
  primaryName: string;
  memberCount: number;
  memberNames: string[];
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");

  // Personal data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [email, setEmail] = useState("");
  const [stayStart, setStayStart] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );
  const [stayEnd, setStayEnd] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );

  // Group joining
  const [showGroupJoin, setShowGroupJoin] = useState(false);
  const [groupPhone, setGroupPhone] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupJoined, setGroupJoined] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [searchingGroup, setSearchingGroup] = useState(false);

  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myGuestId, setMyGuestId] = useState<string | null>(null);

  async function searchGroup() {
    if (!groupPhone.trim() || groupPhone.trim().length < 5) {
      setGroupError("Introdu un numar de telefon valid.");
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
      setGroupError(err instanceof Error ? err.message : "Grup negasit.");
    } finally {
      setSearchingGroup(false);
    }
  }

  async function joinGroup() {
    if (!myGuestId || !groupInfo) return;
    setLoading(true);
    setGroupError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join-group", guestId: myGuestId, targetGroupId: groupInfo.groupId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setGroupJoined(true);
      setGroupInfo({ ...groupInfo, memberCount: json.data.memberCount });
    } catch (err: unknown) {
      setGroupError(err instanceof Error ? err.message : "Eroare la alaturare.");
    } finally {
      setLoading(false);
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
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "self-register",
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          stayStart,
          stayEnd,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setMyGuestId(json.data.id);
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
    setShowGroupJoin(false);
    setGroupPhone("");
    setGroupInfo(null);
    setGroupJoined(false);
    setGroupError(null);
    setError(null);
    setMyGuestId(null);
  }

  const inputCls =
    "w-full bg-white/[0.06] border border-white/[0.1] px-3 py-3 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/30";

  // ── SUCCESS SCREEN ──
  if (step === "success") {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] text-white px-6 py-12">
        <div className="max-w-sm mx-auto text-center">
          <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Date trimise!</h1>
          <p className="text-white/60 text-sm mb-8">
            Receptia va valida datele tale si iti va aloca un loc pe plaja.
            Te rugam sa astepti confirmarea.
          </p>

          {/* Group join section */}
          {!groupJoined && (
            <div className="text-left mb-8">
              <button
                onClick={() => setShowGroupJoin(!showGroupJoin)}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] py-3 text-[#C9AB81] font-bold text-xs tracking-wider uppercase mb-3"
              >
                <Users className="w-4 h-4" />
                {showGroupJoin ? "Ascunde" : "Adauga-te la un grup de familie"}
              </button>

              {showGroupJoin && (
                <div className="bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
                  <p className="text-white/50 text-xs">
                    Daca faci parte dintr-o familie sau grup, introdu numarul de telefon al unui membru deja inregistrat.
                  </p>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                      <input
                        type="tel"
                        value={groupPhone}
                        onChange={(e) => setGroupPhone(e.target.value)}
                        className={`${inputCls} pl-9`}
                        placeholder="Nr. telefon membru grup"
                      />
                    </div>
                    <button
                      onClick={searchGroup}
                      disabled={searchingGroup}
                      className="px-4 bg-[#C9AB81] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                    >
                      {searchingGroup ? "..." : "Cauta"}
                    </button>
                  </div>

                  {groupError && <p className="text-red-400 text-xs">{groupError}</p>}

                  {groupInfo && (
                    <div className="bg-emerald-400/10 border border-emerald-400/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <p className="text-emerald-400 text-sm font-bold">Grup gasit!</p>
                      </div>
                      <p className="text-white/70 text-xs mb-1">
                        Grup: {groupInfo.primaryName}
                      </p>
                      <p className="text-white/50 text-xs mb-3">
                        {groupInfo.memberCount} {groupInfo.memberCount === 1 ? "membru" : "membri"}: {groupInfo.memberNames.join(", ")}
                      </p>
                      <button
                        onClick={joinGroup}
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                      >
                        {loading ? "Se alatura..." : "Alatura-te grupului"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {groupJoined && (
            <div className="bg-emerald-400/10 border border-emerald-400/20 p-4 mb-8 text-center">
              <Users className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-bold">Te-ai alaturat grupului!</p>
              <p className="text-white/50 text-xs mt-1">
                {groupInfo?.memberCount} membri in grup
              </p>
            </div>
          )}

          <button
            onClick={resetForm}
            className="w-full bg-white/[0.06] border border-white/[0.1] py-3 text-white/60 font-bold text-xs tracking-wider uppercase"
          >
            Inregistrare noua
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
        <div className="text-center mb-8">
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
            Instructiuni
          </p>
          <ol className="text-white/50 text-xs space-y-1.5 list-decimal list-inside">
            <li>Completeaza datele tale personale</li>
            <li>Daca esti intr-o familie, dupa trimitere poti sa te alaturi grupului lor</li>
            <li>Receptia va valida datele si iti va aloca locul pe plaja</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block">
              Nume complet *
            </label>
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

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block">
                Telefon *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputCls} pl-9`}
                  placeholder="+40712345678"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block">
                Email *
              </label>
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
          </div>

          {/* Stay period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block">
                De la
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <input
                  type="date"
                  value={stayStart}
                  onChange={(e) => setStayStart(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block">
                Pana la
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <input
                  type="date"
                  value={stayEnd}
                  onChange={(e) => setStayEnd(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
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
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Se trimite..." : "Trimite pentru validare"}
          </button>
        </form>

        {/* Back to home */}
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
