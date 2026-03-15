"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lock, RefreshCw, ImageIcon, QrCode, Plus, Trash2, Download, Printer, LayoutGrid, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { PromoBanner } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import BannerManager from "@/components/BannerManager";
import GalleryManager from "@/components/GalleryManager";
import SectionHelp from "@/components/SectionHelp";

type Tab = "banners" | "qrcodes" | "gallery";

interface UmbrellaQR {
  id: string;
  zone: string;
}

const SESSION_KEY = "kuziini_loft_session";
const SESSION_HOURS = 1;

function getSavedSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { password: pw, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > SESSION_HOURS * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return pw;
  } catch { return null; }
}

function saveSession(pw: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ password: pw, timestamp: Date.now() }));
}

export default function LoftPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [tab, setTab] = useState<Tab>("banners");
  const [gallerySlots, setGallerySlots] = useState(3);
  const [galleryAspect, setGalleryAspect] = useState<GalleryAspect>("square");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLibrary, setGalleryLibrary] = useState<LibraryPhoto[]>([]);

  // QR state
  const [umbrellas, setUmbrellas] = useState<UmbrellaQR[]>([
    { id: "A-01", zone: "Zona Lounge" },
    { id: "A-02", zone: "Zona Lounge" },
    { id: "B-07", zone: "Zona Beach" },
    { id: "VIP-03", zone: "VIP Premium" },
  ]);
  const [newId, setNewId] = useState("");
  const [newZone, setNewZone] = useState("Zona Lounge");
  const printRef = useRef<HTMLDivElement>(null);
  const autoLoginDone = useRef(false);

  useEffect(() => {
    if (autoLoginDone.current) return;
    autoLoginDone.current = true;
    const saved = getSavedSession();
    if (saved) {
      setPassword(saved);
      // Auto-login with saved password
      (async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: saved, category: "loft", action: "list" }),
          });
          const json = await res.json();
          if (json.success) {
            setBanners(json.data);
            setStoredPassword(saved);
            setAuthenticated(true);
            fetch("/api/gallery", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: saved, category: "loft", action: "get" }),
            })
              .then((r) => r.json())
              .then((j) => {
                if (j.success) {
                  setGallerySlots(j.data.slots);
                  if (j.data.aspect) setGalleryAspect(j.data.aspect);
                  setGalleryImages(j.data.images);
                  if (j.data.library) setGalleryLibrary(j.data.library);
                }
              });
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  async function handleLogin() {
    if (!password.trim()) {
      setError("Introdu parola.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, category: "loft", action: "list" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setBanners(json.data);
      setStoredPassword(password);
      setAuthenticated(true);
      saveSession(password);
      // Fetch gallery
      fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, category: "loft", action: "get" }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            setGallerySlots(j.data.slots);
            if (j.data.aspect) setGalleryAspect(j.data.aspect);
            setGalleryImages(j.data.images);
            if (j.data.library) setGalleryLibrary(j.data.library);
          }
        });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: storedPassword, category: "loft", action: "list" }),
      });
      const json = await res.json();
      if (json.success) setBanners(json.data);
    } finally {
      setLoading(false);
    }
  }

  function addUmbrella() {
    const trimmed = newId.trim().toUpperCase();
    if (!trimmed) return;
    if (umbrellas.some((u) => u.id === trimmed)) return;
    setUmbrellas((prev) => [...prev, { id: trimmed, zone: newZone }]);
    setNewId("");
  }

  function removeUmbrella(id: string) {
    setUmbrellas((prev) => prev.filter((u) => u.id !== id));
  }

  const downloadQR = useCallback((umbrellaId: string, zone: string) => {
    const svg = document.getElementById(`qr-${umbrellaId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 40;
    const qrSize = 300;
    const textHeight = 80;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;

    const img = new Image();
    img.onload = () => {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // QR code
      ctx.drawImage(img, padding, padding, qrSize, qrSize);

      // Umbrella ID
      ctx.fillStyle = "#0A0A0A";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(umbrellaId, canvas.width / 2, qrSize + padding + 35);

      // Zone
      ctx.fillStyle = "#888888";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(zone, canvas.width / 2, qrSize + padding + 60);

      // Download
      const link = document.createElement("a");
      link.download = `QR-${umbrellaId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  function printAllQRs() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrCards = umbrellas.map((u) => {
      const svg = document.getElementById(`qr-${u.id}`);
      const svgHtml = svg ? new XMLSerializer().serializeToString(svg) : "";
      return `
        <div style="display:inline-block;width:200px;margin:15px;text-align:center;page-break-inside:avoid;border:1px solid #ddd;padding:20px;border-radius:8px;">
          <div style="background:white;padding:10px;display:inline-block;">${svgHtml}</div>
          <p style="font-size:22px;font-weight:bold;margin:10px 0 2px;font-family:Arial,sans-serif;">${u.id}</p>
          <p style="font-size:13px;color:#888;margin:0;font-family:Arial,sans-serif;">${u.zone}</p>
          <p style="font-size:10px;color:#bbb;margin-top:6px;font-family:Arial,sans-serif;">kuziini.app</p>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR Codes - LOFT</title></head>
      <body style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
        <h2 style="margin-bottom:20px;">QR Codes Umbrele - LOFT × Kuziini</h2>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;">
          ${qrCards.join("")}
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
              alt="LOFT"
              className="h-12 object-contain mx-auto mb-4 opacity-80"
            />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Manager LOFT
            </h1>
            <p className="text-white/40 text-xs mt-1">Bannere & QR Codes</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
                Parolă
              </label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
                <Lock className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
                  placeholder="Introdu parola LOFT"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? "Se verifică..." : "Autentificare"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "banners", label: "Bannere", icon: <ImageIcon className="w-4 h-4" /> },
    { key: "gallery", label: "Galerie", icon: <LayoutGrid className="w-4 h-4" /> },
    { key: "qrcodes", label: "QR Codes", icon: <QrCode className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Manager LOFT</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">
              Bannere & QR Codes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="h-9 flex items-center gap-1.5 px-3 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] text-[10px] font-bold tracking-wider uppercase active:bg-[#C9AB81]/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live App
            </a>
            <button
              onClick={refresh}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                tab === t.key
                  ? "bg-[#C9AB81] text-[#0A0A0A]"
                  : "bg-white/[0.06] text-white/40"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Banners Tab */}
        {tab === "banners" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">
                {banners.length} bannere · Apar pe pagina clienților în secțiunea LOFT
              </p>
              <SectionHelp items={[
                "Bannerele apar pe pagina clientului (pagina umbrelelei) si se rotesc automat la fiecare 4 secunde.",
                "Apasa 'Adauga banner' pentru a crea un banner nou. Titlul este obligatoriu.",
                "Poti adauga un emoji sau o imagine (max 500KB) pentru a face bannerul mai vizibil.",
                "Sectiunea 'Produs din meniu' iti permite sa asociezi un produs. Cand clientul apasa pe banner, produsul se adauga automat in cosul lui.",
                "Foloseste sagetile sus/jos pentru a schimba ordinea bannerelor.",
                "Apasa iconita de editare (salvare) pentru a modifica un banner existent.",
                "Apasa iconita rosie (cos de gunoi) pentru a sterge un banner.",
              ]} />
            </div>
            <BannerManager
              category="loft"
              password={storedPassword}
              banners={banners}
              onUpdate={setBanners}
            />
          </>
        )}

        {/* Gallery Tab */}
        {tab === "gallery" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">
                Pozele apar pe pagina de landing in sectiunea LOFT
              </p>
              <SectionHelp items={[
                "Alege numarul de ferestre (1, 2, 3, 4 sau 6) pentru a seta cate poze apar pe landing page.",
                "Alege aspectul imaginii: Patrat, Portret sau Peisaj. Aceasta schimba forma tuturor ferestrelor.",
                "Apasa pe o fereastra goala pentru a alege o poza din biblioteca sau apasa 'Din PC' pentru a incarca direct.",
                "Treci mouse-ul peste o poza existenta pentru a vedea optiunile: Inlocuieste, Biblioteca sau Sterge.",
                "Poti trage si plasa pozele intre ferestre pentru a le schimba ordinea (drag & drop).",
                "Biblioteca de poze pastreaza toate pozele incarcate. Pozele sunt redimensionate automat (max 1200px).",
                "Poti incarca poze direct in biblioteca apasand butonul 'Incarca' din sectiunea Biblioteca.",
              ]} />
            </div>
            <GalleryManager
              category="loft"
              password={storedPassword}
              slots={gallerySlots}
              aspect={galleryAspect}
              images={galleryImages}
              library={galleryLibrary}
              onUpdate={(d) => {
                setGallerySlots(d.slots);
                if (d.aspect) setGalleryAspect(d.aspect);
                setGalleryImages(d.images);
                if (d.library) setGalleryLibrary(d.library);
              }}
            />
          </>
        )}

        {/* QR Codes Tab */}
        {tab === "qrcodes" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">
                QR codes pentru umbrele
              </p>
              <SectionHelp items={[
                "Fiecare umbrela are un QR code unic care duce clientul la pagina de comanda.",
                "Adauga o umbrela noua introducand ID-ul (ex: C-01) si selectand zona.",
                "Apasa 'Salveaza' pe fiecare QR pentru a-l descarca ca imagine PNG.",
                "Apasa 'Printeaza toate' pentru a deschide o pagina de print cu toate QR-urile.",
                "Sterge o umbrela apasand iconita rosie de pe cardul QR-ului.",
                "QR-ul generat duce la: kuziini.app/u/[ID-UMBRELA]",
              ]} />
            </div>
            {/* Add umbrella */}
            <div className="bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
              <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                Adaugă umbrelă
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="ID (ex: C-01)"
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/20"
                  onKeyDown={(e) => e.key === "Enter" && addUmbrella()}
                />
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-[#C9AB81]/50"
                >
                  <option value="Zona Lounge">Zona Lounge</option>
                  <option value="Zona Beach">Zona Beach</option>
                  <option value="VIP Premium">VIP Premium</option>
                </select>
              </div>
              <button
                onClick={addUmbrella}
                className="w-full flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2 font-bold text-xs tracking-wider uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                Adaugă
              </button>
            </div>

            {/* Print all button */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={printAllQRs}
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] py-2.5 text-white/60 text-xs font-bold tracking-wider uppercase active:bg-white/[0.1] transition-colors"
              >
                <Printer className="w-4 h-4" />
                Printează toate ({umbrellas.length})
              </button>
            </div>

            <p className="text-white/30 text-xs mb-3">{umbrellas.length} umbrele</p>

            {/* QR Grid */}
            <div ref={printRef} className="grid grid-cols-2 gap-3">
              {umbrellas.map((u) => (
                <div
                  key={u.id}
                  className="bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center"
                >
                  <div className="bg-white p-2 mb-3">
                    <QRCodeSVG
                      id={`qr-${u.id}`}
                      value={`https://kuziini.app/u/${u.id}`}
                      size={100}
                      level="M"
                    />
                  </div>
                  <p className="font-bold text-sm text-white tracking-wide">{u.id}</p>
                  <p className="text-[#C9AB81] text-[10px] tracking-wider uppercase mb-3">
                    {u.zone}
                  </p>

                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => downloadQR(u.id, u.zone)}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#C9AB81] text-[#0A0A0A] py-1.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      <Download className="w-3 h-3" />
                      Salvează
                    </button>
                    <button
                      onClick={() => removeUmbrella(u.id)}
                      className="w-8 flex items-center justify-center bg-red-500/10 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
