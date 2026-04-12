"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminData,
  useOffers,
  useGalleryStats,
  useAccessLog,
  useOnlineUsers,
  queryKeys,
} from "@/hooks/use-admin";
import * as adminApi from "@/lib/api";
import {
  Lock, Users, ShoppingBag, Receipt, DollarSign, RefreshCw, Umbrella,
  ImageIcon, LayoutGrid, FileText, Bell, BarChart3, ExternalLink,
  Volume2, VolumeX, UserPlus, CalendarCheck, Map, Shield, Palette, Inbox,
} from "lucide-react";
import type { PromoBanner } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import { type AdminTheme, THEME_LABELS, getSavedTheme, saveTheme } from "@/lib/admin-theme";
import type {
  AdminData, OfferEntry, AnalyticsData, GalleryStatsData, AccessData, Tab,
} from "@/types/admin-dashboard";

import dynamic from "next/dynamic";

// ─── Eagerly loaded (visible on first render) ──────────────────────────────
import OverviewTab from "@/components/admin/kuziini/OverviewTab";
import { SectionErrorBoundary } from "@/components/admin/SectionErrorBoundary";

// ─── Lazy loaded (only when tab is selected) ────────────────────────────────
const LoginsTab = dynamic(() => import("@/components/admin/kuziini/LoginsTab"));
const OrdersTab = dynamic(() => import("@/components/admin/kuziini/OrdersTab"));
const BillsTab = dynamic(() => import("@/components/admin/kuziini/BillsTab"));
const OffersTab = dynamic(() => import("@/components/admin/kuziini/OffersTab"));
const ClientsTab = dynamic(() => import("@/components/admin/kuziini/ClientsTab"));
const AccessLogTab = dynamic(() => import("@/components/admin/kuziini/AccessLogTab"));
const UmbrellasTab = dynamic(() => import("@/components/admin/kuziini/UmbrellasTab"));
const BannerSection = dynamic(() => import("@/components/admin/BannerSection"));
const GallerySection = dynamic(() => import("@/components/admin/GallerySection"));
const GuestDashboard = dynamic(() => import("@/components/admin/GuestDashboard"));
const GuestCheckinForm = dynamic(() => import("@/components/admin/GuestCheckinForm"));
const GuestList = dynamic(() => import("@/components/admin/GuestList"));
const DailyConfirmationPanel = dynamic(() => import("@/components/admin/DailyConfirmationPanel"));
const LoungerGrid = dynamic(() => import("@/components/admin/LoungerGrid"));
const AdminUserManager = dynamic(() => import("@/components/admin/AdminUserManager"));
const PendingRegistrations = dynamic(() => import("@/components/admin/PendingRegistrations"));

// ─── Audio notification system ──────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let audioResumed = false;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

if (typeof window !== "undefined") {
  const resumeAudio = () => {
    if (audioResumed) return;
    try {
      const ctx = getAudioCtx();
      ctx.resume().then(() => { audioResumed = true; });
    } catch {}
  };
  document.addEventListener("click", resumeAudio, { once: false });
  document.addEventListener("keydown", resumeAudio, { once: false });
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") { ctx.resume(); return; }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function soundNewUser() {
  playTone(523, 0.15, "sine", 0.25);
  setTimeout(() => playTone(659, 0.15, "sine", 0.25), 120);
  setTimeout(() => playTone(784, 0.3, "sine", 0.3), 240);
}
function soundPayment() {
  playTone(880, 0.08, "square", 0.15);
  setTimeout(() => playTone(880, 0.08, "square", 0.15), 100);
  setTimeout(() => playTone(1320, 0.4, "sine", 0.3), 200);
}
function soundOffer() {
  playTone(440, 0.2, "sine", 0.2);
  setTimeout(() => playTone(660, 0.2, "sine", 0.25), 180);
  setTimeout(() => playTone(880, 0.35, "triangle", 0.2), 360);
}
function soundHeart() {
  playTone(700, 0.12, "sine", 0.15);
  setTimeout(() => playTone(900, 0.18, "sine", 0.2), 80);
}
function soundInstall() {
  playTone(523, 0.2, "sine", 0.2);
  setTimeout(() => playTone(659, 0.2, "sine", 0.2), 150);
  setTimeout(() => playTone(784, 0.2, "sine", 0.25), 300);
  setTimeout(() => playTone(1047, 0.5, "sine", 0.3), 450);
}

// ─── Session helpers ────────────────────────────────────────────────────────

const SESSION_KEY = "kuziini_admin_session";
const SESSION_HOURS = 24;

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

// ─── Tab config ─────────────────────────────────────────────────────────────

const KUZIINI_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "General", icon: <DollarSign className="w-4 h-4" /> },
  { key: "logins", label: "Logări", icon: <Users className="w-4 h-4" /> },
  { key: "orders", label: "Comenzi", icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "bills", label: "Note", icon: <Receipt className="w-4 h-4" /> },
  { key: "umbrellas", label: "Umbrele", icon: <Umbrella className="w-4 h-4" /> },
  { key: "banners", label: "Bannere", icon: <ImageIcon className="w-4 h-4" /> },
  { key: "gallery", label: "Galerie", icon: <LayoutGrid className="w-4 h-4" /> },
  { key: "offers", label: "Oferte", icon: <FileText className="w-4 h-4" /> },
  { key: "clients", label: "Clienți", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "rapoarte", label: "Rapoarte", icon: <Bell className="w-4 h-4" /> },
];

const MAYA_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "guest-dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "guest-checkin", label: "Check-in", icon: <UserPlus className="w-4 h-4" /> },
  { key: "guest-pending", label: "Cereri", icon: <Inbox className="w-4 h-4" /> },
  { key: "guest-list", label: "Oaspeți", icon: <Users className="w-4 h-4" /> },
  { key: "guest-daily", label: "Zilnic", icon: <CalendarCheck className="w-4 h-4" /> },
  { key: "guest-loungers", label: "Hartă", icon: <Map className="w-4 h-4" /> },
  { key: "admin-users", label: "Admini", icon: <Shield className="w-4 h-4" /> },
];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  // Content state (local, managed by BannerManager/GalleryManager)
  const [kuziiniBanners, setKuziiniBanners] = useState<PromoBanner[]>([]);
  const [gallerySlots, setGallerySlots] = useState(3);
  const [galleryAspect, setGalleryAspect] = useState<GalleryAspect>("square");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLibrary, setGalleryLibrary] = useState<LibraryPhoto[]>([]);
  const [mayaAdminId, setMayaAdminId] = useState<string | null>(null);

  // ─── React Query hooks (auto-refetch, auto-cache) ───────────────────────
  const { data: adminData, refetch: refetchAdmin } = useAdminData(authenticated);
  const { data: offers = [], refetch: refetchOffers } = useOffers(authenticated);
  const { data: galleryStats } = useGalleryStats(authenticated);
  const { data: accessData, refetch: refetchAccessLog } = useAccessLog(authenticated);
  const { data: onlineData } = useOnlineUsers(authenticated);

  // Derive state from React Query data
  const data = adminData ?? null;
  const accessUnread = accessData?.unread ?? 0;
  const onlineCount = onlineData?.online ?? 0;
  const onlinePhones = useMemo(
    () => new Set(onlineData?.phones ?? []),
    [onlineData?.phones]
  );

  // Analytics is a useMemo-triggered query since it depends on other data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  useEffect(() => {
    if (!authenticated || !adminData) return;
    adminApi
      .fetchClientProfiles({
        logins: adminData.logins,
        orders: adminData.orders,
        billRequests: adminData.billRequests,
        offers,
      })
      .then(setAnalyticsData)
      .catch(() => {});
  }, [authenticated, adminData, offers]);

  // UI state
  const [theme, setThemeState] = useState<AdminTheme>("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const prevStatsRef = useRef<{ logins: number; orders: number; bills: number; offers: number; likes: number; accessEntries: number } | null>(null);
  const autoLoginDone = useRef(false);

  useEffect(() => { setThemeState(getSavedTheme()); }, []);
  function cycleTheme() {
    const order: AdminTheme[] = ["dark", "light", "gold"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setThemeState(next);
    saveTheme(next);
  }

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Clear unread when viewing Rapoarte
  useEffect(() => {
    if (tab !== "rapoarte" || !authenticated || accessUnread === 0) return;
    adminApi.markAccessLogRead().then(() => {
      qc.invalidateQueries({ queryKey: queryKeys.accessLog });
      const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
      nav.clearAppBadge?.();
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authenticated, accessUnread]);

  // Auto-login
  useEffect(() => {
    if (autoLoginDone.current) return;
    autoLoginDone.current = true;
    const saved = getSavedSession();
    if (saved) {
      setPassword(saved);
      login(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push notification check
  useEffect(() => {
    if (!authenticated) return;
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, [authenticated]);

  // Load kuziini banners/gallery on login (not covered by React Query - has its own managers)
  useEffect(() => {
    if (!authenticated) return;
    Promise.all([
      fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "kuziini", action: "list" }) }).then(r => r.json()),
      fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "kuziini", action: "get" }) }).then(r => r.json()),
    ]).then(([bJson, gJson]) => {
      if (bJson.success) setKuziiniBanners(bJson.data);
      if (gJson.success) {
        setGallerySlots(gJson.data.slots);
        if (gJson.data.aspect) setGalleryAspect(gJson.data.aspect);
        setGalleryImages(gJson.data.images);
        if (gJson.data.library) setGalleryLibrary(gJson.data.library);
      }
    }).catch(() => {});
  }, [authenticated]);

  // Audio notifications on data changes
  useEffect(() => {
    if (!data || !soundEnabled) return;
    const curr = {
      logins: data.stats.totalLogins,
      orders: data.stats.totalOrders,
      bills: data.stats.totalBillRequests,
      offers: offers.length,
      likes: galleryStats?.photos?.reduce((s, p) => s + p.likes, 0) || 0,
      accessEntries: accessData?.totalEntries || 0,
    };
    const prev = prevStatsRef.current;
    if (prev) {
      if (curr.logins > prev.logins) soundNewUser();
      if (curr.bills > prev.bills) soundPayment();
      if (curr.offers > prev.offers) soundOffer();
      if (curr.likes > prev.likes) soundHeart();
      if (curr.accessEntries > prev.accessEntries && curr.logins === prev.logins) soundInstall();
    }
    prevStatsRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, offers, galleryStats, accessData]);

  // ─── Login action ─────────────────────────────────────────────────────────

  async function login(pw: string) {
    setLoading(true);
    setError(null);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@maya.ro", password: pw }),
      });
      const loginJson = await loginRes.json();
      if (!loginJson.success) throw new Error(loginJson.error);
      setMayaAdminId(loginJson.data.id);
      setAuthenticated(true);
      saveSession(pw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare.");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!password.trim()) { setError("Introdu parola."); return; }
    try { getAudioCtx().resume().then(() => { audioResumed = true; }); } catch {}
    login(password);
  }

  function manualRefresh() {
    refetchAdmin();
    refetchOffers();
    refetchAccessLog();
  }

  async function subscribePush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push");
      const keyJson = await keyRes.json();
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        const output = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
        return output;
      };
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) });
      const subJson = sub.toJSON();
      await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", subscription: { endpoint: subJson.endpoint, keys: subJson.keys } }) });
      setPushEnabled(true);
    } catch (e) { console.error("Push subscription failed:", e); }
  }

  // ─── Login screen ─────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6" data-theme={theme}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-maya-gold/20 border border-maya-gold/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-maya-gold" />
            </div>
            <h1 className="text-2xl font-bold th-text tracking-wide">Kuziini</h1>
            <p className="th-text-muted text-xs mt-1">Kuziini × Maya</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-maya-gold uppercase tracking-[0.2em] mb-2 block">Parolă</label>
              <div className="flex items-center gap-3 bg-gray-50 border th-border px-4 py-3 focus-within:border-maya-gold/50 transition-colors">
                <Lock className="w-4 h-4 th-text-muted shrink-0" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="flex-1 bg-transparent outline-none th-text text-sm placeholder:text-gray-400" placeholder="Introdu parola" autoFocus />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={handleLogin} disabled={loading} className="w-full bg-maya-gold text-maya-dark py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50">
              {loading ? "Se verifică..." : "Autentificare"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ─── Main layout ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh" data-theme={theme}>
      {/* Header */}
      <div className="th-header backdrop-blur-md border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Kuziini Panel</h1>
            <p className="text-maya-gold text-[10px] tracking-[0.2em] uppercase">Kuziini × Maya</p>
          </div>
          <div className="flex items-center gap-2">
            {!pushEnabled ? (
              <button onClick={subscribePush} className="h-9 flex items-center gap-1.5 px-3 bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider uppercase active:bg-red-500/25 transition-colors">
                <Bell className="w-3.5 h-3.5" /> Push
              </button>
            ) : (
              <div className="h-9 flex items-center gap-1.5 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" title="Notificări push active">
                <Bell className="w-3.5 h-3.5" />
              </div>
            )}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) try { const ctx = getAudioCtx(); ctx.resume().then(() => { audioResumed = true; soundNewUser(); }); } catch {}
              }}
              className={`w-9 h-9 flex items-center justify-center transition-colors ${soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-200 th-text-muted"}`}
              title={soundEnabled ? "Sunet activat" : "Sunet dezactivat"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="h-9 flex items-center gap-1.5 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {onlineCount}
            </div>
            <a href="/" className="h-9 flex items-center gap-1.5 px-3 bg-maya-gold/20 border border-maya-gold/30 text-maya-gold text-[10px] font-bold tracking-wider uppercase active:bg-maya-gold/30 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Live App
            </a>
            <button onClick={cycleTheme} className="h-9 flex items-center gap-1 px-2 bg-maya-gold/20 border border-maya-gold/30 text-maya-gold text-[10px] font-bold tracking-wider uppercase" title={`Tema: ${THEME_LABELS[theme]}`}>
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button onClick={manualRefresh} disabled={loading} className="w-9 h-9 flex items-center justify-center th-tab-inactive transition-colors">
              <RefreshCw className={`w-4 h-4 th-text-muted ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs - Kuziini */}
        <div className="mt-3">
          <p className="th-text-faint text-[8px] font-bold tracking-[0.3em] uppercase mb-1">KUZIINI</p>
          <div className="flex gap-1 overflow-x-auto">
            {KUZIINI_TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all relative ${tab === t.key ? "bg-maya-gold text-maya-dark" : "th-tab-inactive th-text-muted"}`}>
                {t.icon} {t.label}
                {t.key === "rapoarte" && accessUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">{accessUnread}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Tabs - Maya */}
        <div className="mt-2">
          <p className="th-text-faint text-[8px] font-bold tracking-[0.3em] uppercase mb-1">MAYA · OASPETI</p>
          <div className="flex gap-1 overflow-x-auto">
            {MAYA_TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${tab === t.key ? "bg-maya-gold text-maya-dark" : "th-tab-inactive th-text-muted"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 space-y-4">
        <SectionErrorBoundary section={tab} key={tab}>
          {tab === "overview" && <OverviewTab data={data} />}
          {tab === "logins" && <LoginsTab logins={data.logins} />}
          {tab === "orders" && <OrdersTab orders={data.orders} />}
          {tab === "bills" && <BillsTab billRequests={data.billRequests} />}
          {tab === "umbrellas" && <UmbrellasTab umbrellas={data.umbrellas} />}
          {tab === "banners" && <BannerSection category="kuziini" banners={kuziiniBanners} onUpdate={setKuziiniBanners} />}
          {tab === "gallery" && (
            <GallerySection
              category="kuziini"
              data={{ slots: gallerySlots, aspect: galleryAspect, images: galleryImages, library: galleryLibrary }}
              onUpdate={(d) => {
                setGallerySlots(d.slots);
                if (d.aspect) setGalleryAspect(d.aspect);
                setGalleryImages(d.images);
                if (d.library) setGalleryLibrary(d.library);
              }}
            />
          )}
          {tab === "offers" && <OffersTab offers={offers} onUpdate={() => refetchOffers()} galleryImages={galleryImages} />}
          {tab === "clients" && <ClientsTab analyticsData={analyticsData} galleryStats={galleryStats ?? null} onlinePhones={onlinePhones} accessData={accessData ?? null} />}
          {tab === "rapoarte" && <AccessLogTab accessData={accessData ?? null} onlinePhones={onlinePhones} accessUnread={accessUnread} />}

          {/* Maya guest management tabs */}
          {tab === "guest-dashboard" && mayaAdminId && (
            <GuestDashboard adminId={mayaAdminId} onNavigate={(t) => setTab(t as Tab)} />
          )}
          {tab === "guest-checkin" && mayaAdminId && <GuestCheckinForm adminId={mayaAdminId} />}
          {tab === "guest-pending" && mayaAdminId && <PendingRegistrations adminId={mayaAdminId} />}
          {tab === "guest-list" && mayaAdminId && <GuestList adminId={mayaAdminId} />}
          {tab === "guest-daily" && mayaAdminId && <DailyConfirmationPanel adminId={mayaAdminId} />}
          {tab === "guest-loungers" && mayaAdminId && <LoungerGrid adminId={mayaAdminId} />}
          {tab === "admin-users" && mayaAdminId && <AdminUserManager adminId={mayaAdminId} />}
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
