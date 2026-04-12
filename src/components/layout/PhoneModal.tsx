"use client";

import { useState, useEffect } from "react";
import { User, X, Crown, Clock, CheckCircle2 } from "lucide-react";
import { useSessionStore } from "@/store";
import PhoneInput from "@/components/PhoneInput";

interface PhoneModalProps {
  umbrellaId: string;
  onClose: () => void;
}

interface SessionInfo {
  hasOwner: boolean;
  ownerName?: string;
  ownerPhone?: string;
}

type Mode = "loading" | "owner" | "join" | "pending";

export function PhoneModal({ umbrellaId, onClose }: PhoneModalProps) {
  const [mode, setMode] = useState<Mode>("loading");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserSession } = useSessionStore();

  // Auto-fill from saved contact data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kuziini_contact");
      if (saved) {
        const { name: n, phone: p } = JSON.parse(saved);
        if (n) setName(n);
        if (p) setPhone(p);
      }
    } catch {}
  }, []);

  // Detect umbrella session state on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/umbrella/${umbrellaId}/session`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.success) {
          setSessionInfo({
            hasOwner: j.data.hasOwner,
            ownerName: j.data.ownerName,
            ownerPhone: j.data.ownerPhone,
          });
          setMode(j.data.hasOwner ? "join" : "owner");
        } else {
          setMode("owner");
        }
      })
      .catch(() => {
        if (!cancelled) setMode("owner");
      });
    return () => { cancelled = true; };
  }, [umbrellaId]);

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
    setLoading(true);
    setError(null);
    try {
      const isJoinFlow = mode === "join";
      const res = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umbrellaId,
          phone: cleaned,
          name: trimmedName,
          joinAsGuest: isJoinFlow,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Save contact for next visit
      localStorage.setItem("kuziini_contact", JSON.stringify({
        name: trimmedName,
        phone: cleaned,
      }));

      // If guest is pending owner approval, show waiting screen
      if (json.data.pendingApproval) {
        setMode("pending");
        return;
      }

      // Otherwise set the session and close
      setUserSession({
        phone: json.data.phone,
        name: trimmedName,
        role: json.data.role,
        sessionId: json.data.sessionId,
        umbrellaId: json.data.umbrellaId,
        homeUmbrellaId: json.data.homeUmbrellaId || undefined,
        isRegistered: json.data.isRegistered ?? true,
        joinedAt: json.data.joinedAt,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la înregistrare.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg bg-[#141414] border-t border-maya-gold/30 p-6 pb-10 animate-slide-up text-center">
          <div className="w-10 h-10 border-2 border-maya-gold/40 border-t-maya-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Verificam umbrela...</p>
        </div>
      </div>
    );
  }

  // ─── Pending approval (guest waiting for owner) ───────────────────────────
  if (mode === "pending") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-lg bg-[#141414] border-t border-maya-gold/30 p-6 pb-10 animate-slide-up text-center">
          <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Cerere trimisa!
          </h2>
          <p className="text-white/60 text-sm mb-1">
            Cererea ta de alaturare a fost trimisa lui
          </p>
          <p className="text-maya-gold font-bold text-base mb-4">
            {sessionInfo?.ownerName || "owner"}
          </p>
          <p className="text-white/40 text-xs mb-6 leading-relaxed">
            Asteapta sa fii aprobat. Imediat ce esti aprobat vei putea sa vezi meniul si comenzile grupului.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-white/[0.06] border border-white/[0.1] py-3 text-white/60 font-bold text-xs tracking-wider uppercase"
          >
            Inchide
          </button>
        </div>
      </div>
    );
  }

  // ─── Owner or Join flow (form) ────────────────────────────────────────────
  const isJoin = mode === "join";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#141414] border-t border-maya-gold/30 p-6 pb-10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isJoin ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-maya-gold" />
                  <h2 className="text-xl font-bold text-white tracking-wide">
                    Aceasta umbrela are deja un grup
                  </h2>
                </div>
                <p className="text-white/40 text-xs tracking-wide">
                  Introdu datele tale pentru a cere alaturarea
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Bun venit
                </h2>
                <p className="text-white/40 text-xs mt-1 tracking-wide">
                  Esti primul aici - vei deveni owner al umbrelei
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 active:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Owner info card (only in join mode) */}
        {isJoin && sessionInfo && (
          <div className="bg-maya-gold/5 border border-maya-gold/20 p-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-maya-gold/15 border border-maya-gold/30 rounded-full flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-maya-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-maya-gold font-bold tracking-wider uppercase">Owner umbrela</p>
              <p className="text-white text-sm font-bold truncate">{sessionInfo.ownerName || "Anonim"}</p>
              <p className="text-white/40 text-xs">{sessionInfo.ownerPhone}</p>
            </div>
          </div>
        )}

        {/* Name field */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-maya-gold uppercase tracking-[0.2em] mb-2 block">
            Nume
          </label>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-maya-gold/50 transition-colors">
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

        {/* Phone field */}
        <div className="mb-2">
          <label className="text-[10px] font-bold text-maya-gold uppercase tracking-[0.2em] mb-2 block">
            Telefon
          </label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}

        <p className="text-white/20 text-[10px] mt-3 mb-6 leading-relaxed">
          {isJoin
            ? "Cererea ta va fi trimisa owner-ului. Imediat ce esti aprobat vei putea vedea meniul si comenzile grupului."
            : "Vei deveni owner al umbrelei. Vei putea aproba alti oaspeti care vor sa se alature grupului tau."}
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-maya-gold text-maya-dark py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Se procesează..." : isJoin ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Cere alaturare
            </>
          ) : "Continua ca owner"}
        </button>
      </div>
    </div>
  );
}
