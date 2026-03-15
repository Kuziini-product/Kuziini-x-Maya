"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Users, ShoppingBag, Receipt, DollarSign, RefreshCw, Umbrella, ImageIcon, LayoutGrid, FileText, Eye, Trash2, Heart, BarChart3, ArrowUpDown, ExternalLink, Bell, ChevronRight, ArrowLeft, Clock, Smartphone, Monitor, Volume2, VolumeX } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PromoBanner } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";
import BannerManager from "@/components/BannerManager";
import GalleryManager from "@/components/GalleryManager";
import SectionHelp from "@/components/SectionHelp";

interface Stats {
  totalLogins: number;
  uniquePhones: number;
  totalOrders: number;
  totalRevenue: number;
  totalBillRequests: number;
  paymentBreakdown: Record<string, number>;
}

interface UmbrellaInfo {
  id: string;
  zone: string;
  active: boolean;
  hasSession: boolean;
  ownerPhone: string | null;
  sessionStarted: string | null;
}

interface LoginEntry {
  name: string;
  phone: string;
  umbrellaId: string;
  timestamp: string;
}

interface OrderEntry {
  orderId: string;
  umbrellaId: string;
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  timestamp: string;
}

interface BillEntry {
  umbrellaId: string;
  paymentMethod: string;
  amount: number;
  timestamp: string;
}

interface AdminData {
  stats: Stats;
  umbrellas: UmbrellaInfo[];
  logins: LoginEntry[];
  orders: OrderEntry[];
  billRequests: BillEntry[];
}

interface OfferEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  photoUrl: string;
  photoIndex?: number;
  photoIndexes?: number[];
  timestamp: string;
  read: boolean;
}

interface ClientProfile {
  phone: string;
  name: string;
  email: string;
  source: ("receptie" | "oferta")[];
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  totalSpent: number;
  totalOrders: number;
  avgPerVisit: number;
  paymentMethods: Record<string, number>;
  kuziiniPhotosViewed: number;
  kuziiniPhotoLikes: number;
  offerRequests: number;
  offerDetails: { message: string; photoUrl: string; timestamp: string }[];
  umbrellas: string[];
}

interface PhotoStatEntry {
  index: number;
  likes: number;
  views: number;
}

interface AnalyticsData {
  clients: ClientProfile[];
  photoStats: PhotoStatEntry[];
  totalPhotoViews: number;
  uniqueViewers: number;
}

type ClientSort = "spent" | "visits" | "recent" | "orders" | "name";
type ClientFilter = "all" | "receptie" | "oferta";

interface GalleryUserStat {
  sessionId: string;
  photosViewed: number;
  totalTimeSpent: number;
  photoDetails: { photoIndex: number; timestamp: string; duration: number }[];
  likes: number;
  firstView: string;
  lastView: string;
}

interface GalleryPhotoStat {
  index: number;
  likes: number;
  views: number;
  avgDuration: number;
  totalDuration: number;
}

interface GalleryStatsData {
  users: GalleryUserStat[];
  photos: GalleryPhotoStat[];
  hourlyViews: number[];
  totalViews: number;
  uniqueViewers: number;
  totalTimeSpent: number;
}

interface AccessUser {
  name: string;
  phone: string;
  email: string;
  totalAccess: number;
  firstAccess: string;
  lastAccess: string;
  pages: { page: string; action: string; umbrellaId: string; timestamp: string }[];
}

interface AccessData {
  unread: number;
  totalEntries: number;
  users: AccessUser[];
}

type Tab = "overview" | "logins" | "orders" | "bills" | "umbrellas" | "banners" | "gallery" | "offers" | "clients" | "rapoarte";

const SESSION_KEY = "kuziini_admin_session";
const SESSION_HOURS = 24; // Stay logged in for 24h

// ── Audio notification system ──
let audioCtx: AudioContext | null = null;
let audioResumed = false;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Resume audio context on any user interaction
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
    if (ctx.state === "suspended") {
      ctx.resume();
      return; // skip this time, will play next
    }
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
  } catch { /* audio not available */ }
}

function soundNewUser() {
  // Ascending chime: C5 → E5 → G5
  playTone(523, 0.15, "sine", 0.25);
  setTimeout(() => playTone(659, 0.15, "sine", 0.25), 120);
  setTimeout(() => playTone(784, 0.3, "sine", 0.3), 240);
}

function soundPayment() {
  // Cash register: two quick high tones + ding
  playTone(880, 0.08, "square", 0.15);
  setTimeout(() => playTone(880, 0.08, "square", 0.15), 100);
  setTimeout(() => playTone(1320, 0.4, "sine", 0.3), 200);
}

function soundOffer() {
  // Soft bell: low to high sweep
  playTone(440, 0.2, "sine", 0.2);
  setTimeout(() => playTone(660, 0.2, "sine", 0.25), 180);
  setTimeout(() => playTone(880, 0.35, "triangle", 0.2), 360);
}

function soundHeart() {
  // Soft pop: quick warm tone
  playTone(700, 0.12, "sine", 0.15);
  setTimeout(() => playTone(900, 0.18, "sine", 0.2), 80);
}

function soundInstall() {
  // Fanfare: ascending major chord
  playTone(523, 0.2, "sine", 0.2);
  setTimeout(() => playTone(659, 0.2, "sine", 0.2), 150);
  setTimeout(() => playTone(784, 0.2, "sine", 0.25), 300);
  setTimeout(() => playTone(1047, 0.5, "sine", 0.3), 450);
}

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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [kuziiniBanners, setKuziiniBanners] = useState<PromoBanner[]>([]);
  const [gallerySlots, setGallerySlots] = useState(3);
  const [galleryAspect, setGalleryAspect] = useState<GalleryAspect>("square");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLibrary, setGalleryLibrary] = useState<LibraryPhoto[]>([]);
  const [offers, setOffers] = useState<OfferEntry[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [clientSort, setClientSort] = useState<ClientSort>("spent");
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [accessUnread, setAccessUnread] = useState(0);
  const [selectedAccessUser, setSelectedAccessUser] = useState<AccessUser | null>(null);
  const [galleryStats, setGalleryStats] = useState<GalleryStatsData | null>(null);
  const [selectedGalleryUser, setSelectedGalleryUser] = useState<GalleryUserStat | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlinePhones, setOnlinePhones] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const prevStatsRef = useRef<{ logins: number; orders: number; bills: number; offers: number; likes: number; accessEntries: number } | null>(null);
  const autoLoginDone = useRef(false);

  // Poll online users count
  useEffect(() => {
    if (!authenticated) return;
    function fetchOnline() {
      fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getOnline" }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            setOnlineCount(j.online);
            if (j.phones) setOnlinePhones(new Set(j.phones));
          }
        })
        .catch(() => {});
    }
    fetchOnline();
    const interval = setInterval(fetchOnline, 30_000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // Clear unread when viewing Rapoarte tab
  useEffect(() => {
    if (tab !== "rapoarte" || !authenticated || accessUnread === 0) return;
    fetch("/api/access-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "markRead" }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setAccessUnread(0);
          // Clear PWA badge
          const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
          nav.clearAppBadge?.();
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (autoLoginDone.current) return;
    autoLoginDone.current = true;
    const saved = getSavedSession();
    if (saved) {
      setPassword(saved);
      fetchData(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check push notification status
  useEffect(() => {
    if (!authenticated) return;
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, [authenticated]);

  async function subscribePush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      // Get VAPID public key
      const keyRes = await fetch("/api/push");
      const keyJson = await keyRes.json();
      const vapidKey = keyJson.publicKey;

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        const output = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
        return output;
      };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = sub.toJSON();
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        }),
      });

      setPushEnabled(true);
    } catch (e) {
      console.error("Push subscription failed:", e);
    }
  }

  // Auto-refresh all data every 15 seconds for live updates
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, password]);

  // Detect changes and play audio notifications
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
      // New user registered (scan QR)
      if (curr.logins > prev.logins) soundNewUser();
      // New bill/payment request
      if (curr.bills > prev.bills) soundPayment();
      // New offer request
      if (curr.offers > prev.offers) soundOffer();
      // New like/heart
      if (curr.likes > prev.likes) soundHeart();
      // New access (possible app install/open)
      if (curr.accessEntries > prev.accessEntries && curr.logins === prev.logins) soundInstall();
    }
    prevStatsRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, offers, galleryStats, accessData]);

  async function fetchData(pw?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
      setAuthenticated(true);
      saveSession(pw || password);
      // Fetch Kuziini banners
      const bRes = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password, category: "kuziini", action: "list" }),
      });
      const bJson = await bRes.json();
      if (bJson.success) setKuziiniBanners(bJson.data);
      // Fetch Kuziini gallery
      const gRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password, category: "kuziini", action: "get" }),
      });
      const gJson = await gRes.json();
      if (gJson.success) {
        setGallerySlots(gJson.data.slots);
        if (gJson.data.aspect) setGalleryAspect(gJson.data.aspect);
        setGalleryImages(gJson.data.images);
        if (gJson.data.library) setGalleryLibrary(gJson.data.library);
      }
      // Fetch offers
      const oRes = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password, action: "list" }),
      });
      const oJson = await oRes.json();
      if (oJson.success) setOffers(oJson.data);
      // Fetch analytics/client profiles
      const aRes = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw || password,
          action: "getClientProfiles",
          logins: json.data.logins,
          orders: json.data.orders,
          billRequests: json.data.billRequests,
          offers: oJson.success ? oJson.data : [],
        }),
      });
      const aJson = await aRes.json();
      if (aJson.success) setAnalyticsData(aJson.data);
      // Fetch gallery stats
      const gsRes = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password, action: "getGalleryStats" }),
      });
      const gsJson = await gsRes.json();
      if (gsJson.success) setGalleryStats(gsJson.data);
      // Fetch access log
      const acRes = await fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw || password, action: "getLog" }),
      });
      const acJson = await acRes.json();
      if (acJson.success) {
        setAccessData(acJson.data);
        setAccessUnread(acJson.data.unread);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare.");
      if (!authenticated) setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!password.trim()) {
      setError("Introdu parola.");
      return;
    }
    // Resume audio context on login (user gesture)
    try { getAudioCtx().resume().then(() => { audioResumed = true; }); } catch {}
    fetchData();
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
  }

  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#C9AB81]/20 border border-[#C9AB81]/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#C9AB81]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Kuziini</h1>
            <p className="text-white/40 text-xs mt-1">Kuziini × LOFT</p>
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
                  placeholder="Introdu parola"
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

  if (!data) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
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

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Kuziini Panel</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">Kuziini × LOFT</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Push notifications toggle */}
            {!pushEnabled && (
              <button
                onClick={subscribePush}
                className="h-9 flex items-center gap-1.5 px-3 bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider uppercase active:bg-red-500/25 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                Push
              </button>
            )}
            {pushEnabled && (
              <div className="h-9 flex items-center gap-1.5 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" title="Notificări push active">
                <Bell className="w-3.5 h-3.5" />
              </div>
            )}
            {/* Sound toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  // Resume audio context on user gesture + play test sound
                  try {
                    const ctx = getAudioCtx();
                    ctx.resume().then(() => {
                      audioResumed = true;
                      soundNewUser(); // Play test sound
                    });
                  } catch {}
                }
              }}
              className={`w-9 h-9 flex items-center justify-center transition-colors ${soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/30"}`}
              title={soundEnabled ? "Sunet activat" : "Sunet dezactivat"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Online users badge */}
            <div className="h-9 flex items-center gap-1.5 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {onlineCount}
            </div>
            <a
              href="/"
              className="h-9 flex items-center gap-1.5 px-3 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] text-[10px] font-bold tracking-wider uppercase active:bg-[#C9AB81]/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live App
            </a>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all relative ${
                tab === t.key
                  ? "bg-[#C9AB81] text-[#0A0A0A]"
                  : "bg-white/[0.06] text-white/40"
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === "rapoarte" && accessUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {accessUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Overview */}
        {tab === "overview" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">Statistici generale</p>
              <SectionHelp items={[
                "Aceasta sectiune afiseaza statisticile generale ale platformei in timp real.",
                "Total logari: numarul total de autentificari ale clientilor prin QR code.",
                "Utilizatori unici: numarul de numere de telefon distincte care s-au logat.",
                "Total comenzi si Venit total: toate comenzile plasate si suma totala.",
                "Note solicitate: cate cereri de nota/plata au fost trimise de clienti.",
                "Umbrele active: cate umbrele au sesiuni active in acest moment.",
                "Metodele de plata arata distributia intre cash, card si alte metode.",
              ]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total logări" value={data.stats.totalLogins} onClick={() => setTab("logins")} />
              <StatCard label="Utilizatori unici" value={data.stats.uniquePhones} onClick={() => setTab("rapoarte")} />
              <StatCard label="Total comenzi" value={data.stats.totalOrders} onClick={() => setTab("orders")} />
              <StatCard label="Venit total" value={formatPrice(data.stats.totalRevenue)} gold onClick={() => setTab("bills")} />
              <StatCard label="Note solicitate" value={data.stats.totalBillRequests} onClick={() => setTab("bills")} />
              <StatCard
                label="Umbrele active"
                value={data.umbrellas.filter((u) => u.hasSession).length}
                onClick={() => setTab("umbrellas")}
              />
            </div>

            {Object.keys(data.stats.paymentBreakdown).length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] p-4">
                <h3 className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  Metode de plată
                </h3>
                {Object.entries(data.stats.paymentBreakdown).map(([method, count]) => (
                  <div key={method} className="flex justify-between text-sm py-1">
                    <span className="text-white/60 capitalize">{method}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Logins */}
        {tab === "logins" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">{data.logins.length} inregistrari</p>
              <SectionHelp items={[
                "Aici vezi toate logarile clientilor prin QR code, in ordine cronologica.",
                "Fiecare intrare arata: numele clientului, numarul de telefon si umbrela scanata.",
                "Timestamp-ul din dreapta arata data si ora logarii.",
                "Foloseste butonul de refresh din header pentru a actualiza datele.",
              ]} />
            </div>
            {data.logins.length === 0 ? (
              <EmptyMsg text="Nicio logare înregistrată." />
            ) : (
              data.logins.map((l, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm text-white tracking-wide">
                      {l.name || "—"}
                    </p>
                    <span className="text-[10px] text-white/70">{formatTime(l.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>{l.phone}</span>
                    <span className="text-[#C9AB81]">⛱️ {l.umbrellaId}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">{data.orders.length} comenzi</p>
              <SectionHelp items={[
                "Lista tuturor comenzilor plasate de clienti, cu detalii complete.",
                "Fiecare comanda arata: ID comanda, telefon client, umbrela, produsele comandate si totalul.",
                "Comenzile sunt afisate in ordine cronologica inversa (cele mai recente primele).",
              ]} />
            </div>
            {data.orders.length === 0 ? (
              <EmptyMsg text="Nicio comandă înregistrată." />
            ) : (
              data.orders.map((o, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-white tracking-wide">
                      {o.orderId}
                    </p>
                    <span className="text-[10px] text-white/70">{formatTime(o.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
                    <span>{o.phone}</span>
                    <span className="text-[#C9AB81]">⛱️ {o.umbrellaId}</span>
                  </div>
                  <div className="space-y-1">
                    {o.items.map((item, j) => (
                      <div key={j} className="flex justify-between text-xs text-white/50">
                        <span>{item.quantity}× {item.name}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-xs text-white/40">Total</span>
                    <span className="text-sm font-bold text-[#C9AB81]">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Bills */}
        {tab === "bills" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">{data.billRequests.length} note solicitate</p>
              <SectionHelp items={[
                "Aici vezi toate cererile de nota de plata trimise de clienti.",
                "Fiecare cerere arata: umbrela, metoda de plata aleasa si suma totala.",
                "Cand un client apasa 'Cere nota' din aplicatie, cererea apare aici automat.",
              ]} />
            </div>
            {data.billRequests.length === 0 ? (
              <EmptyMsg text="Nicio notă solicitată." />
            ) : (
              data.billRequests.map((b, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-white tracking-wide">
                      ⛱️ {b.umbrellaId}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5 capitalize">{b.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#C9AB81]">{formatPrice(b.amount)}</p>
                    <p className="text-[10px] text-white/70">{formatTime(b.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Banners Kuziini */}
        {tab === "banners" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">
                {kuziiniBanners.length} bannere Kuziini
              </p>
              <SectionHelp items={[
                "Bannerele apar pe pagina clientului (pagina umbrelelei) si se rotesc automat la fiecare 4 secunde.",
                "Apasa 'Adauga banner' pentru a crea un banner nou. Titlul este obligatoriu.",
                "Poti adauga un emoji sau o imagine (max 500KB) pentru a face bannerul mai vizibil.",
                "Sectiunea 'Link Instagram' iti permite sa adaugi un link Instagram. Cand clientul apasa pe banner, se deschide pagina de Instagram direct.",
                "Foloseste sagetile sus/jos pentru a schimba ordinea bannerelor.",
                "Apasa iconita de editare (salvare) pentru a modifica un banner existent.",
                "Apasa iconita rosie (cos de gunoi) pentru a sterge un banner.",
              ]} />
            </div>
            <BannerManager
              category="kuziini"
              password={password}
              banners={kuziiniBanners}
              onUpdate={setKuziiniBanners}
            />
          </>
        )}

        {/* Gallery Kuziini */}
        {tab === "gallery" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">
                Pozele apar pe landing in sectiunea Kuziini
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
              category="kuziini"
              password={password}
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

        {/* Offers */}
        {tab === "offers" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">
                {offers.length} solicitări
                {offers.filter((o) => !o.read).length > 0 && (
                  <span className="ml-2 text-[#C9AB81] font-bold">
                    ({offers.filter((o) => !o.read).length} noi)
                  </span>
                )}
              </p>
            </div>
            {offers.length === 0 ? (
              <EmptyMsg text="Nicio solicitare de ofertă." />
            ) : (
              offers.map((o) => (
                <div
                  key={o.id}
                  className={`bg-white/[0.03] border p-4 ${
                    o.read ? "border-white/[0.06]" : "border-[#C9AB81]/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {(() => {
                      const indexes = o.photoIndexes || (o.photoIndex !== undefined ? [o.photoIndex] : []);
                      if (indexes.length > 0 && galleryImages.length > 0) {
                        return (
                          <div className="flex gap-1 shrink-0">
                            {indexes.map((idx) => galleryImages[idx] ? (
                              <img
                                key={idx}
                                src={galleryImages[idx].url}
                                alt={`Foto #${idx + 1}`}
                                className="w-14 h-14 object-cover border border-white/[0.08]"
                              />
                            ) : null)}
                          </div>
                        );
                      }
                      if (o.photoUrl) {
                        return <img src={o.photoUrl} alt="" className="w-16 h-16 object-cover shrink-0 border border-white/[0.08]" />;
                      }
                      return null;
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-white tracking-wide">
                          {o.name}
                          {!o.read && (
                            <span className="ml-2 text-[8px] bg-[#C9AB81] text-[#0A0A0A] px-1.5 py-0.5 font-bold tracking-wider uppercase">
                              NOU
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-white/70 shrink-0">{formatTime(o.timestamp)}</span>
                      </div>
                      <p className="text-xs text-white/50">{o.phone}</p>
                      <p className="text-xs text-[#C9AB81]/70">{o.email}</p>
                      {o.message && (
                        <p className="text-xs text-white/40 mt-1 italic">&ldquo;{o.message}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!o.read && (
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/offers", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ password, action: "markRead", offerId: o.id }),
                          });
                          const json = await res.json();
                          if (json.success) setOffers(json.data);
                        }}
                        className="flex items-center gap-1.5 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-white/60"
                      >
                        <Eye className="w-3 h-3" />
                        Marchează citit
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/offers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ password, action: "delete", offerId: o.id }),
                        });
                        const json = await res.json();
                        if (json.success) setOffers(json.data);
                      }}
                      className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                      Șterge
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Clients / Analytics */}
        {tab === "clients" && (
          <>
            {!analyticsData ? (
              <EmptyMsg text="Se încarcă datele..." />
            ) : selectedGalleryUser ? (
              /* ── Gallery user detail view ── */
              <div>
                <button
                  onClick={() => setSelectedGalleryUser(null)}
                  className="flex items-center gap-1.5 text-[#C9AB81] text-xs font-bold tracking-wider uppercase mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Înapoi
                </button>
                <div className="bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                  <p className="font-bold text-lg text-white tracking-wide">{selectedGalleryUser.sessionId.slice(0, 20)}...</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white/[0.03] px-2 py-2 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Poze văzute</p>
                      <p className="text-xl font-bold text-white">{selectedGalleryUser.photosViewed}</p>
                    </div>
                    <div className="bg-white/[0.03] px-2 py-2 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Timp total</p>
                      <p className="text-xl font-bold text-white">{formatDuration(selectedGalleryUser.totalTimeSpent)}</p>
                    </div>
                    <div className="bg-white/[0.03] px-2 py-2 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Like-uri</p>
                      <p className="text-xl font-bold text-red-400">{selectedGalleryUser.likes}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/70 mt-3">
                    <span>Prima vizită: {formatTime(selectedGalleryUser.firstView)}</span>
                    <span>Ultima: {formatTime(selectedGalleryUser.lastView)}</span>
                  </div>
                </div>

                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  Poze accesate ({selectedGalleryUser.photoDetails.length})
                </p>
                <div className="space-y-2">
                  {[...selectedGalleryUser.photoDetails].reverse().map((p, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 shrink-0">
                          <Eye className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white font-bold">Poza #{p.photoIndex + 1}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            {p.duration > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-bold tracking-wider">
                                {formatDuration(p.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/70 shrink-0">{formatTime(p.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard label="Total clienți" value={analyticsData.clients.length} />
                  <StatCard label="Vizualizări poze" value={galleryStats?.totalViews || analyticsData.totalPhotoViews} />
                  <StatCard label="Vizitatori unici galerie" value={galleryStats?.uniqueViewers || analyticsData.uniqueViewers} />
                  <StatCard
                    label="Total cheltuieli"
                    value={formatPrice(analyticsData.clients.reduce((s, c) => s + c.totalSpent, 0))}
                    gold
                  />
                </div>

                {/* Detailed gallery stats */}
                {galleryStats && (
                  <div className="bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                    <h3 className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5" />
                      Statistici Galerie
                    </h3>

                    {/* Total time spent */}
                    <div className="bg-white/[0.03] p-3 mb-3 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Timp total vizualizare</p>
                      <p className="text-xl font-bold text-[#C9AB81]">{formatDuration(galleryStats.totalTimeSpent)}</p>
                    </div>

                    {/* Photo breakdown */}
                    <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">Per poză</p>
                    <div className="space-y-2 mb-4">
                      {galleryStats.photos.map((p) => (
                        <div key={p.index} className="bg-white/[0.02] p-2.5 flex items-center justify-between">
                          <span className="text-white/60 text-xs font-bold">Poza #{p.index + 1}</span>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-white/40">{p.views} vizualizări</span>
                            <span className="text-blue-400 font-bold">{formatDuration(p.avgDuration)} mediu</span>
                            <span className="flex items-center gap-1 text-red-400 font-bold">
                              <Heart className="w-3 h-3 fill-red-400" />
                              {p.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hourly distribution */}
                    <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2 text-center">Vizualizări pe ore</p>
                    <div className="flex items-end justify-center gap-0.5 h-16 mb-1 mx-auto max-w-full">
                      {galleryStats.hourlyViews.map((count, hour) => {
                        const max = Math.max(...galleryStats.hourlyViews, 1);
                        const h = Math.max((count / max) * 100, count > 0 ? 8 : 2);
                        return (
                          <div
                            key={hour}
                            className={`flex-1 rounded-t-sm transition-all ${count > 0 ? "bg-[#C9AB81]" : "bg-white/10"}`}
                            style={{ height: `${h}%` }}
                            title={`${hour}:00 — ${count} vizualizări`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-white/20 px-0">
                      <span>00</span>
                      <span>03</span>
                      <span>06</span>
                      <span>09</span>
                      <span>12</span>
                      <span>15</span>
                      <span>18</span>
                      <span>21</span>
                      <span>23</span>
                    </div>

                    {/* Per-user gallery stats */}
                    <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mt-4 mb-2">
                      Vizitatori unici ({galleryStats.users.length})
                    </p>
                    <div className="space-y-2">
                      {galleryStats.users.map((u) => (
                        <button
                          key={u.sessionId}
                          onClick={() => setSelectedGalleryUser(u)}
                          className="w-full bg-white/[0.02] p-3 text-left active:bg-white/[0.06] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-white font-bold">{u.sessionId.slice(0, 24)}...</p>
                              <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1">
                                <span>{u.photosViewed} poze</span>
                                <span className="text-blue-400">{formatDuration(u.totalTimeSpent)}</span>
                                {u.likes > 0 && (
                                  <span className="flex items-center gap-1 text-red-400">
                                    <Heart className="w-2.5 h-2.5 fill-red-400" />
                                    {u.likes}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-white/60 mt-0.5">
                                {formatTime(u.firstView)} — {formatTime(u.lastView)}
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter by source */}
                <div className="flex gap-1.5 mb-3">
                  {([["all", "Toți"], ["receptie", "Recepție"], ["oferta", "Cereri ofertă"]] as [ClientFilter, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setClientFilter(key)}
                      className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all ${
                        clientFilter === key
                          ? "bg-[#C9AB81] text-[#0A0A0A]"
                          : "bg-white/[0.06] text-white/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sort & search */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Caută client (nume, telefon, email)..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="flex-1 bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white text-xs placeholder:text-white/30 outline-none focus:border-[#C9AB81]/50"
                  />
                  <button
                    onClick={() => {
                      const sorts: ClientSort[] = ["spent", "visits", "recent", "orders", "name"];
                      const idx = sorts.indexOf(clientSort);
                      setClientSort(sorts[(idx + 1) % sorts.length]);
                    }}
                    className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-white/60"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    {clientSort === "spent" && "Cheltuieli"}
                    {clientSort === "visits" && "Vizite"}
                    {clientSort === "recent" && "Recenți"}
                    {clientSort === "orders" && "Comenzi"}
                    {clientSort === "name" && "Nume"}
                  </button>
                </div>

                {/* Client list */}
                {(() => {
                  let filtered = [...analyticsData.clients];
                  if (clientFilter !== "all") {
                    filtered = filtered.filter((c) => c.source.includes(clientFilter));
                  }
                  if (clientSearch.trim()) {
                    const q = clientSearch.toLowerCase();
                    filtered = filtered.filter(
                      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
                    );
                  }
                  switch (clientSort) {
                    case "spent": filtered.sort((a, b) => b.totalSpent - a.totalSpent); break;
                    case "visits": filtered.sort((a, b) => b.totalVisits - a.totalVisits); break;
                    case "recent": filtered.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)); break;
                    case "orders": filtered.sort((a, b) => b.totalOrders - a.totalOrders); break;
                    case "name": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
                  }
                  return (<>
                    <p className="text-white/30 text-xs mb-3">
                      {filtered.length} clienți
                      {clientFilter !== "all" && ` (filtru: ${clientFilter === "receptie" ? "recepție" : "cereri ofertă"})`}
                    </p>
                    {filtered.map((c) => {
                      const isOnline = onlinePhones.has(c.phone);
                      return (
                    <div key={c.phone} className={`p-4 mb-3 border ${isOnline ? "bg-emerald-500/[0.06] border-emerald-500/30" : "bg-white/[0.03] border-white/[0.06]"}`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            {isOnline && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            <p className={`font-bold text-sm tracking-wide ${isOnline ? "text-emerald-400" : "text-white"}`}>{c.name}</p>
                            {isOnline && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold tracking-wider uppercase">Online</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40">{c.phone}</p>
                          {c.email && <p className="text-xs text-[#C9AB81]/70">{c.email}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#C9AB81]">{formatPrice(c.totalSpent)}</p>
                          <p className="text-[10px] text-white/30">{c.totalVisits} vizite</p>
                        </div>
                      </div>

                      {/* Source badges */}
                      <div className="flex gap-1.5 mb-2">
                        {c.source.includes("receptie") && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold tracking-wider uppercase">
                            Recepție
                          </span>
                        )}
                        {c.source.includes("oferta") && (
                          <span className="text-[9px] bg-[#C9AB81]/20 text-[#C9AB81] px-2 py-0.5 font-bold tracking-wider uppercase">
                            Cerere ofertă
                          </span>
                        )}
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                          <p className="text-[9px] text-white/30 uppercase tracking-wider">Comenzi</p>
                          <p className="text-sm font-bold text-white">{c.totalOrders}</p>
                        </div>
                        <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                          <p className="text-[9px] text-white/30 uppercase tracking-wider">Medie/vizită</p>
                          <p className="text-sm font-bold text-white">{formatPrice(c.avgPerVisit)}</p>
                        </div>
                        <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                          <p className="text-[9px] text-white/30 uppercase tracking-wider">Oferte</p>
                          <p className="text-sm font-bold text-white">{c.offerRequests}</p>
                        </div>
                      </div>

                      {/* Payment methods */}
                      {Object.keys(c.paymentMethods).length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {Object.entries(c.paymentMethods).map(([method, count]) => (
                            <span key={method} className="text-[10px] bg-white/[0.06] px-2 py-1 text-white/50 capitalize">
                              {method}: {count}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Umbrellas used */}
                      {c.umbrellas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.umbrellas.map((u) => (
                            <span key={u} className="text-[10px] bg-[#C9AB81]/10 text-[#C9AB81]/70 px-1.5 py-0.5">
                              ⛱️ {u}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Offer details */}
                      {c.offerDetails.length > 0 && (
                        <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1.5">
                          <p className="text-[9px] text-[#C9AB81] font-bold tracking-wider uppercase">Solicitări ofertă</p>
                          {c.offerDetails.map((od, oi) => (
                            <div key={oi} className="flex items-start gap-2 bg-white/[0.02] p-2">
                              {od.photoUrl && !od.photoUrl.startsWith("[") && (
                                <img src={od.photoUrl} alt="" className="w-10 h-10 object-cover shrink-0 border border-white/[0.08]" />
                              )}
                              <div className="flex-1 min-w-0">
                                {od.message && <p className="text-[10px] text-white/50 italic">&ldquo;{od.message}&rdquo;</p>}
                                <p className="text-[9px] text-white/60">{formatTime(od.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex justify-between text-[10px] text-white/70 mt-2">
                        <span>Prima: {new Date(c.firstVisit).toLocaleDateString("ro-RO")}</span>
                        <span>Ultima: {new Date(c.lastVisit).toLocaleDateString("ro-RO")}</span>
                      </div>

                      {/* Generate report button */}
                      <button
                        onClick={() => {
                          // Find access data for this user
                          const accessUser = accessData?.users.find((u) => u.phone === c.phone);
                          const lines: string[] = [];
                          lines.push("═══════════════════════════════════════════");
                          lines.push(`RAPORT CLIENT — ${c.name}`);
                          lines.push("═══════════════════════════════════════════");
                          lines.push("");
                          lines.push("── DATE DE CONTACT ──");
                          lines.push(`Nume:    ${c.name}`);
                          lines.push(`Telefon: ${c.phone}`);
                          lines.push(`Email:   ${c.email || "—"}`);
                          lines.push(`Sursa:   ${c.source.join(", ") || "—"}`);
                          lines.push("");
                          lines.push("── STATISTICI GENERALE ──");
                          lines.push(`Total vizite:     ${c.totalVisits}`);
                          lines.push(`Total comenzi:    ${c.totalOrders}`);
                          lines.push(`Total cheltuieli: ${formatPrice(c.totalSpent)}`);
                          lines.push(`Medie/vizită:     ${formatPrice(c.avgPerVisit)}`);
                          lines.push(`Cereri ofertă:    ${c.offerRequests}`);
                          lines.push(`Prima vizită:     ${new Date(c.firstVisit).toLocaleString("ro-RO")}`);
                          lines.push(`Ultima vizită:    ${new Date(c.lastVisit).toLocaleString("ro-RO")}`);
                          lines.push("");
                          if (Object.keys(c.paymentMethods).length > 0) {
                            lines.push("── METODE DE PLATĂ ──");
                            Object.entries(c.paymentMethods).forEach(([m, cnt]) => {
                              lines.push(`  ${m}: ${cnt}×`);
                            });
                            lines.push("");
                          }
                          if (c.umbrellas.length > 0) {
                            lines.push("── UMBRELE FOLOSITE ──");
                            lines.push(`  ${c.umbrellas.join(", ")}`);
                            lines.push("");
                          }
                          if (c.offerDetails.length > 0) {
                            lines.push("── SOLICITĂRI OFERTĂ ──");
                            c.offerDetails.forEach((od, i) => {
                              lines.push(`  ${i + 1}. ${new Date(od.timestamp).toLocaleString("ro-RO")}`);
                              if (od.message) lines.push(`     Mesaj: "${od.message}"`);
                            });
                            lines.push("");
                          }
                          if (accessUser && accessUser.pages.length > 0) {
                            lines.push("── ISTORIC ACCESĂRI ──");
                            [...accessUser.pages].reverse().forEach((p) => {
                              const type = p.action === "scan" ? "Scanare QR" :
                                p.action === "menu" ? "Acces meniu" :
                                p.action === "menu-return" ? "Revenire meniu" : p.action;
                              lines.push(`  ${new Date(p.timestamp).toLocaleString("ro-RO")} — ${type} — ${p.page}${p.umbrellaId ? ` (⛱ ${p.umbrellaId})` : ""}`);
                            });
                            lines.push("");
                          }
                          lines.push("═══════════════════════════════════════════");
                          lines.push(`Raport generat: ${new Date().toLocaleString("ro-RO")}`);
                          lines.push("Kuziini × LOFT — Admin Panel");
                          lines.push("═══════════════════════════════════════════");

                          const text = lines.join("\n");
                          const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `raport-${c.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-2 bg-[#C9AB81]/15 border border-[#C9AB81]/30 text-[#C9AB81] py-2 text-[10px] font-bold tracking-wider uppercase active:bg-[#C9AB81]/25 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Generează raport complet
                      </button>
                    </div>
                      );
                    })}
                  </>);
                })()}
              </>
            )}
          </>
        )}

        {/* Rapoarte / Access Log */}
        {tab === "rapoarte" && (
          <>
            {!accessData ? (
              <EmptyMsg text="Se încarcă datele..." />
            ) : selectedAccessUser ? (
              /* ── Detail view: user access history ── */
              <div>
                <button
                  onClick={() => setSelectedAccessUser(null)}
                  className="flex items-center gap-1.5 text-[#C9AB81] text-xs font-bold tracking-wider uppercase mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Înapoi la lista
                </button>
                <div className={`bg-white/[0.03] border p-4 mb-4 ${onlinePhones.has(selectedAccessUser.phone) ? "border-emerald-500/40" : "border-white/[0.06]"}`}>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-white tracking-wide">{selectedAccessUser.name || "—"}</p>
                    {onlinePhones.has(selectedAccessUser.phone) && (
                      <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold tracking-wider uppercase">
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50">{selectedAccessUser.phone}</p>
                  {selectedAccessUser.email && <p className="text-xs text-[#C9AB81]/70">{selectedAccessUser.email}</p>}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white/[0.03] px-3 py-2 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Total accesări</p>
                      <p className="text-xl font-bold text-white">{selectedAccessUser.totalAccess}</p>
                    </div>
                    <div className="bg-white/[0.03] px-3 py-2 text-center">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Prima accesare</p>
                      <p className="text-xs font-bold text-white mt-1">{formatTime(selectedAccessUser.firstAccess)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  Istoric accesări ({selectedAccessUser.pages.length})
                </p>
                <div className="space-y-2">
                  {[...selectedAccessUser.pages].reverse().map((p, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                          p.action === "scan" ? "bg-emerald-500/20" :
                          p.action === "menu" ? "bg-blue-500/20" :
                          p.action === "menu-return" ? "bg-purple-500/20" :
                          "bg-white/10"
                        }`}>
                          {p.action === "scan" ? <Smartphone className="w-4 h-4 text-emerald-400" /> :
                           p.action === "menu" ? <Monitor className="w-4 h-4 text-blue-400" /> :
                           <Clock className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div>
                          <p className="text-xs text-white font-bold">{p.page}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <span className={`px-1.5 py-0.5 font-bold tracking-wider uppercase ${
                              p.action === "scan" ? "bg-emerald-500/20 text-emerald-400" :
                              p.action === "menu" ? "bg-blue-500/20 text-blue-400" :
                              "bg-purple-500/20 text-purple-400"
                            }`}>
                              {p.action === "scan" ? "Scanare QR" :
                               p.action === "menu" ? "Acces meniu" :
                               p.action === "menu-return" ? "Revenire meniu" :
                               p.action}
                            </span>
                            {p.umbrellaId && <span className="text-[#C9AB81]">⛱️ {p.umbrellaId}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/70 shrink-0">{formatTime(p.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── User list view ── */
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/30 text-xs">
                    {accessData.users.length} utilizatori · {accessData.totalEntries} accesări totale
                    {accessUnread > 0 && (
                      <span className="ml-2 text-red-400 font-bold">({accessUnread} noi)</span>
                    )}
                  </p>
                </div>

                {accessData.users.length === 0 ? (
                  <EmptyMsg text="Nicio accesare înregistrată." />
                ) : (
                  accessData.users.map((u) => {
                    const isOnline = onlinePhones.has(u.phone);
                    return (
                    <button
                      key={u.phone}
                      onClick={() => setSelectedAccessUser(u)}
                      className={`w-full p-4 mb-3 text-left active:bg-white/[0.06] transition-colors border ${
                        isOnline
                          ? "bg-emerald-500/[0.06] border-emerald-500/30"
                          : "bg-white/[0.03] border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isOnline && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            <p className={`font-bold text-sm tracking-wide ${isOnline ? "text-emerald-400" : "text-white"}`}>{u.name || "—"}</p>
                            <span className="text-[9px] bg-[#C9AB81]/20 text-[#C9AB81] px-1.5 py-0.5 font-bold">
                              {u.totalAccess}×
                            </span>
                            {isOnline && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold tracking-wider uppercase">
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40">{u.phone}</p>
                          {u.email && <p className="text-xs text-[#C9AB81]/60">{u.email}</p>}
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/60">
                            <span>Prima: {formatTime(u.firstAccess)}</span>
                            <span>Ultima: {formatTime(u.lastAccess)}</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ml-2 ${isOnline ? "text-emerald-400/40" : "text-white/20"}`} />
                      </div>
                    </button>
                    );
                  })
                )}
              </>
            )}
          </>
        )}

        {/* Umbrellas */}
        {tab === "umbrellas" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs">{data.umbrellas.length} umbrele</p>
              <SectionHelp items={[
                "Aici vezi statusul tuturor umbrelelor inregistrate in sistem.",
                "Verde 'Ocupat' = umbrela are o sesiune activa (un client a scanat QR-ul).",
                "Gri 'Liber' = umbrela este disponibila, niciun client nu a scanat QR-ul.",
                "Informatiile arata: numarul de telefon al clientului si ora la care a inceput sesiunea.",
                "Zona umbrelelei (Lounge, Beach, VIP) ajuta la organizarea spatiului.",
              ]} />
            </div>
            {data.umbrellas.map((u) => (
              <div key={u.id} className="bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛱️</span>
                    <p className="font-bold text-sm text-white tracking-wide">{u.id}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 ${
                      u.hasSession
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-white/30"
                    }`}
                  >
                    {u.hasSession ? "Ocupat" : "Liber"}
                  </span>
                </div>
                <p className="text-xs text-[#C9AB81] tracking-wider uppercase">{u.zone}</p>
                {u.ownerPhone && (
                  <p className="text-xs text-white/40 mt-1">{u.ownerPhone}</p>
                )}
                {u.sessionStarted && (
                  <p className="text-[10px] text-white/20 mt-0.5">
                    Din {formatTime(u.sessionStarted)}
                  </p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, gold, onClick }: { label: string; value: string | number; gold?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`bg-white/[0.03] border border-white/[0.06] p-4 text-left ${onClick ? "active:bg-white/[0.06] transition-colors cursor-pointer" : ""}`}
    >
      <p className="text-[10px] text-white/30 font-bold tracking-[0.15em] uppercase mb-1">
        {label}
        {onClick && <ChevronRight className="w-3 h-3 inline ml-1 opacity-40" />}
      </p>
      <p className={`text-2xl font-bold tracking-wide ${gold ? "text-[#C9AB81]" : "text-white"}`}>
        {value}
      </p>
    </Tag>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] p-8 text-center">
      <p className="text-white/30 text-sm">{text}</p>
    </div>
  );
}
