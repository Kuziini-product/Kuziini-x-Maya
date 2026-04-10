"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  Mail,
  RefreshCw,
  ImageIcon,
  QrCode,
  Plus,
  Trash2,
  Download,
  Printer,
  LayoutGrid,
  ExternalLink,
  BarChart3,
  UserPlus,
  Users,
  CalendarCheck,
  Map,
  Shield,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { PromoBanner, AdminRole } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import BannerManager from "@/components/BannerManager";
import GalleryManager from "@/components/GalleryManager";
import SectionHelp from "@/components/SectionHelp";
import { ALL_UMBRELLAS } from "@/lib/umbrella-config";
import GuestDashboard from "@/components/admin/GuestDashboard";
import GuestCheckinForm from "@/components/admin/GuestCheckinForm";
import GuestList from "@/components/admin/GuestList";
import DailyConfirmationPanel from "@/components/admin/DailyConfirmationPanel";
import LoungerGrid from "@/components/admin/LoungerGrid";
import AdminUserManager from "@/components/admin/AdminUserManager";

type Tab =
  | "dashboard"
  | "checkin"
  | "guests"
  | "daily"
  | "loungers"
  | "banners"
  | "gallery"
  | "qrcodes"
  | "admins";

interface UmbrellaQR {
  id: string;
  zone: string;
}

interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  timestamp: number;
}

const SESSION_KEY = "maya_admin_session";
const SESSION_HOURS = 8;

// Legacy password for banner/gallery API calls
const LEGACY_PASSWORD = "Maya2025";

function getSavedSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() - session.timestamp > SESSION_HOURS * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(admin: AdminSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
}

// Tab definitions with sections and role access
interface TabDef {
  key: Tab;
  label: string;
  icon: React.ReactNode;
  section: "guests" | "content" | "system";
  roles: AdminRole[];
}

const ALL_TABS: TabDef[] = [
  // OASPETI section
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "checkin", label: "Check-in", icon: <UserPlus className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "guests", label: "Oaspeti", icon: <Users className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "daily", label: "Zilnic", icon: <CalendarCheck className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "loungers", label: "Harta", icon: <Map className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  // CONTINUT section
  { key: "banners", label: "Bannere", icon: <ImageIcon className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  { key: "gallery", label: "Galerie", icon: <LayoutGrid className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  { key: "qrcodes", label: "QR Codes", icon: <QrCode className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  // SISTEM section
  { key: "admins", label: "Admini", icon: <Shield className="w-4 h-4" />, section: "system", roles: ["super_admin"] },
];

const SECTION_LABELS: Record<string, string> = {
  guests: "OASPETI",
  content: "CONTINUT",
  system: "SISTEM",
};

export default function MayaAdminPage() {
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Content state (existing)
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [gallerySlots, setGallerySlots] = useState(3);
  const [galleryAspect, setGalleryAspect] = useState<GalleryAspect>("square");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLibrary, setGalleryLibrary] = useState<LibraryPhoto[]>([]);

  // QR state - all 400 umbrellas
  const [umbrellas, setUmbrellas] = useState<UmbrellaQR[]>(
    ALL_UMBRELLAS.map((u) => ({ id: u.id, zone: u.zone }))
  );
  const [newId, setNewId] = useState("");
  const [newZone, setNewZone] = useState("Zona Lounge");
  const printRef = useRef<HTMLDivElement>(null);
  const autoLoginDone = useRef(false);

  // Load content data (banners + gallery)
  const loadContentData = useCallback(async () => {
    try {
      const [bannerRes, galleryRes] = await Promise.all([
        fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: LEGACY_PASSWORD, category: "Maya", action: "list" }),
        }),
        fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: LEGACY_PASSWORD, category: "Maya", action: "get" }),
        }),
      ]);
      const [bannerJson, galleryJson] = await Promise.all([bannerRes.json(), galleryRes.json()]);
      if (bannerJson.success) setBanners(bannerJson.data);
      if (galleryJson.success) {
        setGallerySlots(galleryJson.data.slots);
        if (galleryJson.data.aspect) setGalleryAspect(galleryJson.data.aspect);
        setGalleryImages(galleryJson.data.images);
        if (galleryJson.data.library) setGalleryLibrary(galleryJson.data.library);
      }
    } catch {}
  }, []);

  // Auto-login from saved session
  useEffect(() => {
    if (autoLoginDone.current) return;
    autoLoginDone.current = true;
    const saved = getSavedSession();
    if (saved) {
      setAdminSession(saved);
      setAuthenticated(true);
      // Set default tab based on role
      const firstTab = ALL_TABS.find((t) => t.roles.includes(saved.role));
      if (firstTab) setTab(firstTab.key);
      loadContentData();
    }
  }, [loadContentData]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Introdu email-ul si parola.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: email.trim(), password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const session: AdminSession = {
        id: json.data.id,
        name: json.data.name,
        email: json.data.email,
        role: json.data.role,
        timestamp: Date.now(),
      };
      setAdminSession(session);
      setAuthenticated(true);
      saveSession(session);

      // Set default tab based on role
      const firstTab = ALL_TABS.find((t) => t.roles.includes(session.role));
      if (firstTab) setTab(firstTab.key);

      loadContentData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setAdminSession(null);
    setEmail("");
    setPassword("");
  }

  async function refresh() {
    setLoading(true);
    await loadContentData();
    setLoading(false);
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
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      ctx.fillStyle = "#0A0A0A";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(umbrellaId, canvas.width / 2, qrSize + padding + 35);
      ctx.fillStyle = "#888888";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(zone, canvas.width / 2, qrSize + padding + 60);
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
      <head><title>QR Codes - Maya</title></head>
      <body style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
        <h2 style="margin-bottom:20px;">QR Codes Umbrele - Maya × Kuziini</h2>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;">
          ${qrCards.join("")}
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src="/Maya.png"
              alt="Maya"
              className="h-20 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
              Manager Maya
            </h1>
            <p className="text-gray-600 text-xs mt-1">Administrare completa</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
                Email
              </label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
                <Mail className="w-4 h-4 text-gray-600 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && document.getElementById("pw-input")?.focus()}
                  className="flex-1 bg-transparent outline-none text-gray-900 text-sm placeholder:text-gray-400"
                  placeholder="admin@maya.ro"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
                Parola
              </label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
                <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                <input
                  id="pw-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="flex-1 bg-transparent outline-none text-gray-900 text-sm placeholder:text-gray-400"
                  placeholder="Introdu parola"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? "Se verifica..." : "Autentificare"}
            </button>

            <p className="text-gray-500 text-[10px] text-center">
              Prima accesare? admin@maya.ro / Maya2025
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── TABS FILTERED BY ROLE ────────────────────────────────────────────────
  const visibleTabs = ALL_TABS.filter((t) =>
    adminSession ? t.roles.includes(adminSession.role) : false
  );

  // Group tabs by section
  const sections = visibleTabs.reduce<Record<string, TabDef[]>>((acc, t) => {
    if (!acc[t.section]) acc[t.section] = [];
    acc[t.section].push(t);
    return acc;
  }, {});

  // ─── MAIN LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-white text-gray-900">
      {/* Header */}
      <div className="bg-white backdrop-blur-md border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Manager Maya</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">
              {adminSession?.name} · {adminSession?.role === "super_admin" ? "Super Admin" : adminSession?.role === "content_admin" ? "Content" : "Oaspeti"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="h-9 flex items-center gap-1.5 px-3 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] text-[10px] font-bold tracking-wider uppercase active:bg-[#C9AB81]/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live
            </a>
            <button
              onClick={refresh}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-900/60 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleLogout}
              className="h-9 px-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase"
            >
              Iesire
            </button>
          </div>
        </div>

        {/* Tabs grouped by section */}
        <div className="mt-3 space-y-2">
          {Object.entries(sections).map(([section, tabs]) => (
            <div key={section}>
              <p className="text-gray-500 text-[8px] font-bold tracking-[0.3em] uppercase mb-1">
                {SECTION_LABELS[section]}
              </p>
              <div className="flex gap-1 flex-wrap">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                      tab === t.key
                        ? "bg-[#C9AB81] text-[#0A0A0A]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* ── GUEST SECTION ── */}
        {tab === "dashboard" && adminSession && (
          <GuestDashboard adminId={adminSession.id} onNavigate={(t) => setTab(t as Tab)} />
        )}

        {tab === "checkin" && adminSession && (
          <GuestCheckinForm adminId={adminSession.id} />
        )}

        {tab === "guests" && adminSession && (
          <GuestList adminId={adminSession.id} />
        )}

        {tab === "daily" && adminSession && (
          <DailyConfirmationPanel adminId={adminSession.id} />
        )}

        {tab === "loungers" && adminSession && (
          <LoungerGrid adminId={adminSession.id} />
        )}

        {/* ── CONTENT SECTION (existing) ── */}
        {tab === "banners" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-xs">
                {banners.length} bannere · Apar pe pagina clientilor in sectiunea Maya
              </p>
              <SectionHelp items={[
                "Bannerele apar pe pagina clientului (pagina umbrelelei).",
                "Apasa 'Adauga banner' pentru a crea un banner nou. Titlul este obligatoriu.",
                "Poti adauga un emoji sau o imagine (max 500KB) pentru a face bannerul mai vizibil.",
                "Sectiunea 'Produs din meniu' iti permite sa asociezi un produs. Cand clientul apasa pe banner, produsul se adauga automat in cosul lui.",
                "Titlul bannerului poate fi diferit de numele produsului din meniu (denumire de marketing).",
                "Foloseste sagetile sus/jos pentru a schimba ordinea bannerelor.",
                "Primul banner din lista va fi afisat pe pagina clientului.",
              ]} />
            </div>
            <BannerManager
              category="Maya"
              password={LEGACY_PASSWORD}
              banners={banners}
              onUpdate={setBanners}
            />
          </>
        )}

        {tab === "gallery" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-xs">
                Pozele apar pe pagina de landing in sectiunea Maya
              </p>
              <SectionHelp items={[
                "Alege numarul de ferestre (1, 2, 3, 4 sau 6) pentru a seta cate poze apar pe landing page.",
                "Alege aspectul imaginii: Patrat, Portret sau Peisaj.",
                "Apasa pe o fereastra goala pentru a alege o poza din biblioteca sau apasa 'Din PC' pentru a incarca direct.",
                "Biblioteca de poze pastreaza toate pozele incarcate. Pozele sunt redimensionate automat (max 1200px).",
              ]} />
            </div>
            <GalleryManager
              category="Maya"
              password={LEGACY_PASSWORD}
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

        {tab === "qrcodes" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-xs">
                QR codes pentru umbrele
              </p>
              <SectionHelp items={[
                "Fiecare umbrela are un QR code unic care duce clientul la pagina de comanda.",
                "Adauga o umbrela noua introducand ID-ul (ex: C-01) si selectand zona.",
                "Apasa 'Salveaza' pe fiecare QR pentru a-l descarca ca imagine PNG.",
                "Apasa 'Printeaza toate' pentru a deschide o pagina de print cu toate QR-urile.",
              ]} />
            </div>
            {/* Add umbrella */}
            <div className="bg-gray-100/80 border border-gray-200 p-4 mb-4">
              <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                Adauga umbrela
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="ID (ex: C-01)"
                  className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === "Enter" && addUmbrella()}
                />
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 text-sm outline-none focus:border-[#C9AB81]/50"
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
                Adauga
              </button>
            </div>

            {/* Print all button */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={printAllQRs}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-white/[0.1] py-2.5 text-gray-900/60 text-xs font-bold tracking-wider uppercase active:bg-white/[0.1] transition-colors"
              >
                <Printer className="w-4 h-4" />
                Printeaza toate ({umbrellas.length})
              </button>
            </div>

            <p className="text-gray-600 text-xs mb-3">{umbrellas.length} umbrele</p>

            {/* QR Grid */}
            <div ref={printRef} className="grid grid-cols-2 gap-3">
              {umbrellas.map((u) => (
                <div
                  key={u.id}
                  className="bg-gray-100/80 border border-gray-200 p-4 flex flex-col items-center"
                >
                  <div className="bg-white p-2 mb-3">
                    <QRCodeSVG
                      id={`qr-${u.id}`}
                      value={`https://kuziini.app/u/${u.id}`}
                      size={100}
                      level="M"
                    />
                  </div>
                  <p className="font-bold text-sm text-gray-900 tracking-wide">{u.id}</p>
                  <p className="text-[#C9AB81] text-[10px] tracking-wider uppercase mb-3">
                    {u.zone}
                  </p>

                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => downloadQR(u.id, u.zone)}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#C9AB81] text-[#0A0A0A] py-1.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      <Download className="w-3 h-3" />
                      Salveaza
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

        {/* ── SYSTEM SECTION ── */}
        {tab === "admins" && adminSession && (
          <AdminUserManager adminId={adminSession.id} />
        )}
      </div>
    </div>
  );
}
