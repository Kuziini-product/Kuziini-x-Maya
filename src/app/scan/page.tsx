"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, Mail, Camera, ImageIcon, QrCode, ArrowLeft } from "lucide-react";
import { useSessionStore } from "@/store";
import jsQR from "jsqr";
import Link from "next/link";

type Step = "auth" | "scan";

export default function ScanPage() {
  const router = useRouter();
  const { userSession, setUserSession } = useSessionStore();
  const [step, setStep] = useState<Step>("auth");

  // After hydration, check if user already has a session (zustand persist)
  useEffect(() => {
    if (userSession?.umbrellaId) {
      // Already registered — go directly to menu
      router.push(`/u/${userSession.umbrellaId}`);
    } else if (userSession) {
      // Has auth data but no umbrella — skip to scan step
      setStep("scan");
    }
  }, [userSession, router]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auth step — save locally, no API call yet
  function handleAuth() {
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
    // Save auth data temporarily in session store
    setUserSession({
      phone: cleaned,
      name: trimmedName,
      email: trimmedEmail,
      role: "owner",
      sessionId: "",
      umbrellaId: "",
      isRegistered: true,
      joinedAt: new Date().toISOString(),
    });
    // Also save to localStorage for offer form auto-fill
    localStorage.setItem("kuziini_contact", JSON.stringify({
      name: trimmedName,
      phone: cleaned,
      email: trimmedEmail,
    }));
    setStep("scan");
  }

  // Extract umbrella ID from QR content
  function extractUmbrellaId(content: string): string | null {
    // Try URL pattern: /u/UMBRELLA-ID
    const urlMatch = content.match(/\/u\/([A-Za-z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    // Try plain umbrella ID pattern
    const idMatch = content.match(/^[A-Z]+-\d+$/);
    if (idMatch) return content;
    return null;
  }

  // Register to umbrella and navigate
  async function registerAndNavigate(umbrellaId: string) {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umbrellaId,
          phone: userSession?.phone,
          name: userSession?.name,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUserSession({
        phone: json.data.phone,
        name: userSession?.name || "",
        email: userSession?.email || "",
        role: json.data.role,
        sessionId: json.data.sessionId,
        umbrellaId: json.data.umbrellaId,
        homeUmbrellaId: json.data.homeUmbrellaId || undefined,
        isRegistered: json.data.isRegistered ?? true,
        joinedAt: json.data.joinedAt,
      });
      // Track access
      fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "track",
          name: userSession?.name || "",
          phone: userSession?.phone || "",
          email: userSession?.email || "",
          umbrellaId,
          page: `/u/${umbrellaId}`,
          accessType: "scan",
        }),
      }).catch(() => {});
      router.push(`/u/${umbrellaId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la înregistrare.");
      setScanning(false);
    }
  }

  // Handle QR image from file input (gallery or camera)
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setScanning(true);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const umbrellaId = extractUmbrellaId(code.data);
          if (umbrellaId) {
            registerAndNavigate(umbrellaId);
          } else {
            setError("QR-ul nu conține un cod de umbrelă valid.");
            setScanning(false);
          }
        } else {
          setError("Nu am putut citi QR-ul. Încearcă o altă imagine.");
          setScanning(false);
        }
      };
      img.src = URL.createObjectURL(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [userSession]
  );

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
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
            {step === "auth" ? "Pasul 1 din 2" : "Pasul 2 din 2"}
          </p>
        </div>
        <h1 className="text-2xl font-bold tracking-wide">
          {step === "auth" ? "Identificare" : "Scanează QR"}
        </h1>
        <p className="text-white/40 text-xs mt-1">
          {step === "auth"
            ? "Introdu datele tale pentru a comanda"
            : "Scanează codul QR de pe umbrelă sau încarcă din galerie"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        {step === "auth" ? (
          <div className="space-y-4 mt-4">
            {/* Name */}
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

            {/* Phone */}
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

            {/* Email */}
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
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
            </div>

            <p className="text-white/20 text-[10px] leading-relaxed">
              Datele tale vor fi folosite pentru a primi oferte personalizate.
            </p>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleAuth}
              className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity"
            >
              Continuă
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-6 space-y-6">
            {/* QR icon area */}
            <div className="w-48 h-48 border-2 border-dashed border-[#C9AB81]/30 flex flex-col items-center justify-center">
              <QrCode className="w-16 h-16 text-[#C9AB81]/40 mb-3" />
              <p className="text-white/30 text-xs text-center px-4">
                Îndreaptă camera spre QR sau încarcă din galerie
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="w-full flex items-center justify-center gap-3 bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                {scanning ? "Se procesează..." : "Fotografiază QR"}
              </button>

              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                    // Restore capture after a tick
                    setTimeout(() => {
                      fileInputRef.current?.setAttribute("capture", "environment");
                    }, 100);
                  }
                }}
                disabled={scanning}
                className="w-full flex items-center justify-center gap-3 bg-white/[0.06] border border-white/[0.1] text-white py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
                Încarcă din galerie
              </button>
            </div>

            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Info */}
            <p className="text-white/20 text-[10px] text-center leading-relaxed px-4">
              Nu ai QR fizic? Generează unul din pagina principală sau cere la
              recepție.
            </p>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="px-5 pb-6">
        <div className="flex gap-2">
          <div
            className={`h-1 flex-1 ${step === "auth" ? "bg-[#C9AB81]" : "bg-[#C9AB81]/30"}`}
          />
          <div
            className={`h-1 flex-1 ${step === "scan" ? "bg-[#C9AB81]" : "bg-white/10"}`}
          />
        </div>
      </div>
    </div>
  );
}
