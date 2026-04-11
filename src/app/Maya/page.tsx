"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  ImageIcon,
  QrCode,
  LayoutGrid,
  ExternalLink,
  BarChart3,
  UserPlus,
  Users,
  CalendarCheck,
  Map,
  Shield,
  Palette,
  Inbox,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type AdminTheme, THEME_LABELS, getSavedTheme, saveTheme } from "@/lib/admin-theme";
import type { PromoBanner, AdminRole } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { SectionErrorBoundary } from "@/components/admin/SectionErrorBoundary";
import GuestDashboard from "@/components/admin/GuestDashboard";
import GuestCheckinForm from "@/components/admin/GuestCheckinForm";
import GuestList from "@/components/admin/GuestList";
import PendingRegistrations from "@/components/admin/PendingRegistrations";

// Lazy-loaded: heavy components that include qrcode.react, gallery, map, etc.
const DailyConfirmationPanel = dynamic(() => import("@/components/admin/DailyConfirmationPanel"));
const LoungerGrid = dynamic(() => import("@/components/admin/LoungerGrid"));
const AdminUserManager = dynamic(() => import("@/components/admin/AdminUserManager"));
const BannerSection = dynamic(() => import("@/components/admin/BannerSection"));
const GallerySection = dynamic(() => import("@/components/admin/GallerySection"));
const QRCodeManager = dynamic(() => import("@/components/admin/QRCodeManager"));

// ─── Types & Config ────────────────────────────────────────────────────────────

type Tab =
  | "dashboard" | "checkin" | "pending" | "guests" | "daily" | "loungers"
  | "banners" | "gallery" | "qrcodes" | "admins";

interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

interface TabDef {
  key: Tab;
  label: string;
  icon: React.ReactNode;
  section: "guests" | "content" | "system";
  roles: AdminRole[];
}

const ALL_TABS: TabDef[] = [
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "checkin", label: "Check-in", icon: <UserPlus className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "pending", label: "Cereri", icon: <Inbox className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "guests", label: "Oaspeti", icon: <Users className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "daily", label: "Zilnic", icon: <CalendarCheck className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "loungers", label: "Harta", icon: <Map className="w-4 h-4" />, section: "guests", roles: ["super_admin", "guest_admin"] },
  { key: "banners", label: "Bannere", icon: <ImageIcon className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  { key: "gallery", label: "Galerie", icon: <LayoutGrid className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  { key: "qrcodes", label: "QR Codes", icon: <QrCode className="w-4 h-4" />, section: "content", roles: ["super_admin", "content_admin"] },
  { key: "admins", label: "Admini", icon: <Shield className="w-4 h-4" />, section: "system", roles: ["super_admin"] },
];

const SECTION_LABELS: Record<string, string> = {
  guests: "OASPETI",
  content: "CONTINUT",
  system: "SISTEM",
};

// ─── Page Component ────────────────────────────────────────────────────────────

export default function MayaAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  // Content state
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [gallerySlots, setGallerySlots] = useState(3);
  const [galleryAspect, setGalleryAspect] = useState<GalleryAspect>("square");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLibrary, setGalleryLibrary] = useState<LibraryPhoto[]>([]);

  // Theme
  const [theme, setThemeState] = useState<AdminTheme>("dark");
  useEffect(() => { setThemeState(getSavedTheme()); }, []);
  function cycleTheme() {
    const order: AdminTheme[] = ["dark", "light", "gold"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setThemeState(next);
    saveTheme(next);
  }

  const autoLoginDone = useRef(false);

  // ─── Data loading ────────────────────────────────────────────────────────────

  const loadContentData = useCallback(async () => {
    try {
      const [bannerRes, galleryRes] = await Promise.all([
        fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "Maya", action: "list" }),
        }),
        fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "Maya", action: "get" }),
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

  // ─── Auto-login from server session ──────────────────────────────────────────

  useEffect(() => {
    if (autoLoginDone.current) return;
    autoLoginDone.current = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success) {
          handleAuthenticated(json.data);
        }
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAuthenticated(data: { id: string; name: string; email: string; role: AdminRole }) {
    const session: AdminSession = { id: data.id, name: data.name, email: data.email, role: data.role };
    setAdminSession(session);
    setAuthenticated(true);
    const firstTab = ALL_TABS.find((t) => t.roles.includes(session.role));
    if (firstTab) setTab(firstTab.key);
    loadContentData();
  }

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    setAuthenticated(false);
    setAdminSession(null);
  }

  async function refresh() {
    setLoading(true);
    await loadContentData();
    setLoading(false);
  }

  // ─── Login screen ────────────────────────────────────────────────────────────

  if (!authenticated) {
    return <AdminLoginForm theme={theme} onLogin={handleAuthenticated} />;
  }

  // ─── Tab filtering ───────────────────────────────────────────────────────────

  const visibleTabs = ALL_TABS.filter((t) =>
    adminSession ? t.roles.includes(adminSession.role) : false
  );
  const sections = visibleTabs.reduce<Record<string, TabDef[]>>((acc, t) => {
    if (!acc[t.section]) acc[t.section] = [];
    acc[t.section].push(t);
    return acc;
  }, {});

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh" data-theme={theme}>
      {/* Header */}
      <div className="th-header backdrop-blur-md border-b th-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Manager Maya</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">
              {adminSession?.name} · {adminSession?.role === "super_admin" ? "Super Admin" : adminSession?.role === "content_admin" ? "Content" : "Oaspeti"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="h-9 flex items-center gap-1.5 px-3 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] text-[10px] font-bold tracking-wider uppercase active:bg-[#C9AB81]/30 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Live
            </a>
            <button onClick={refresh} disabled={loading} className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors">
              <RefreshCw className={`w-4 h-4 th-text-muted ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={cycleTheme} className="h-9 flex items-center gap-1 px-2 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] text-[10px] font-bold tracking-wider uppercase" title={`Tema: ${THEME_LABELS[theme]}`}>
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleLogout} className="h-9 px-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase">
              Iesire
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 space-y-2">
          {Object.entries(sections).map(([section, tabs]) => (
            <div key={section}>
              <p className="th-text-faint text-[8px] font-bold tracking-[0.3em] uppercase mb-1">
                {SECTION_LABELS[section]}
              </p>
              <div className="flex gap-1 flex-wrap">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                      tab === t.key ? "bg-[#C9AB81] text-[#0A0A0A]" : "th-tab-inactive th-text-muted"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        <SectionErrorBoundary section={tab} key={tab}>
          {tab === "dashboard" && adminSession && (
            <GuestDashboard adminId={adminSession.id} onNavigate={(t) => {
              const map: Record<string, Tab> = { "guest-list": "guests", "guest-loungers": "loungers", "guest-daily": "daily", "guest-checkin": "checkin" };
              setTab(map[t] || t as Tab);
            }} />
          )}
          {tab === "checkin" && adminSession && <GuestCheckinForm adminId={adminSession.id} />}
          {tab === "pending" && adminSession && <PendingRegistrations adminId={adminSession.id} />}
          {tab === "guests" && adminSession && <GuestList adminId={adminSession.id} />}
          {tab === "daily" && adminSession && <DailyConfirmationPanel adminId={adminSession.id} />}
          {tab === "loungers" && adminSession && <LoungerGrid adminId={adminSession.id} />}
          {tab === "banners" && <BannerSection category="Maya" banners={banners} onUpdate={setBanners} />}
          {tab === "gallery" && (
            <GallerySection
              category="Maya"
              data={{ slots: gallerySlots, aspect: galleryAspect, images: galleryImages, library: galleryLibrary }}
              onUpdate={(d) => {
                setGallerySlots(d.slots);
                if (d.aspect) setGalleryAspect(d.aspect);
                setGalleryImages(d.images);
                if (d.library) setGalleryLibrary(d.library);
              }}
            />
          )}
          {tab === "qrcodes" && <QRCodeManager />}
          {tab === "admins" && adminSession && <AdminUserManager adminId={adminSession.id} />}
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
