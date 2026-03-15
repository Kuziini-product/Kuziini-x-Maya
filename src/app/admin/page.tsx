"use client";

import { useState } from "react";
import { Lock, Users, ShoppingBag, Receipt, DollarSign, RefreshCw, Umbrella, ImageIcon, LayoutGrid, FileText, Eye, Trash2, Heart, BarChart3, ArrowUpDown } from "lucide-react";
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
  timestamp: string;
  read: boolean;
}

interface ClientProfile {
  phone: string;
  name: string;
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

type Tab = "overview" | "logins" | "orders" | "bills" | "umbrellas" | "banners" | "gallery" | "offers" | "clients";

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

  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#C9AB81]/20 border border-[#C9AB81]/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#C9AB81]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Admin</h1>
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
  ];

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">Admin Panel</h1>
            <p className="text-[#C9AB81] text-[10px] tracking-[0.2em] uppercase">Kuziini × LOFT</p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
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
              <StatCard label="Total logări" value={data.stats.totalLogins} />
              <StatCard label="Utilizatori unici" value={data.stats.uniquePhones} />
              <StatCard label="Total comenzi" value={data.stats.totalOrders} />
              <StatCard label="Venit total" value={formatPrice(data.stats.totalRevenue)} gold />
              <StatCard label="Note solicitate" value={data.stats.totalBillRequests} />
              <StatCard
                label="Umbrele active"
                value={data.umbrellas.filter((u) => u.hasSession).length}
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
                    <span className="text-[10px] text-white/30">{formatTime(l.timestamp)}</span>
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
                    <span className="text-[10px] text-white/30">{formatTime(o.timestamp)}</span>
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
                    <p className="text-[10px] text-white/30">{formatTime(b.timestamp)}</p>
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
                    {o.photoUrl && (
                      <img
                        src={o.photoUrl}
                        alt=""
                        className="w-16 h-16 object-cover shrink-0 border border-white/[0.08]"
                      />
                    )}
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
                        <span className="text-[10px] text-white/30 shrink-0">{formatTime(o.timestamp)}</span>
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
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard label="Total clienți" value={analyticsData.clients.length} />
                  <StatCard label="Vizualizări poze" value={analyticsData.totalPhotoViews} />
                  <StatCard label="Vizitatori unici galerie" value={analyticsData.uniqueViewers} />
                  <StatCard
                    label="Total cheltuieli"
                    value={formatPrice(analyticsData.clients.reduce((s, c) => s + c.totalSpent, 0))}
                    gold
                  />
                </div>

                {/* Photo stats */}
                {analyticsData.photoStats.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                    <h3 className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5" />
                      Popularitate poze Kuziini
                    </h3>
                    <div className="space-y-2">
                      {analyticsData.photoStats.map((p) => (
                        <div key={p.index} className="flex items-center justify-between text-sm">
                          <span className="text-white/60">Poza {p.index + 1}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-white/40 text-xs">{p.views} vizualizări</span>
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                              <Heart className="w-3 h-3 fill-red-400" />
                              {p.likes}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort & search */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Caută client..."
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

                <p className="text-white/30 text-xs mb-3">
                  {analyticsData.clients.length} clienți
                </p>

                {/* Client list */}
                {(() => {
                  let filtered = [...analyticsData.clients];
                  if (clientSearch.trim()) {
                    const q = clientSearch.toLowerCase();
                    filtered = filtered.filter(
                      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
                    );
                  }
                  switch (clientSort) {
                    case "spent": filtered.sort((a, b) => b.totalSpent - a.totalSpent); break;
                    case "visits": filtered.sort((a, b) => b.totalVisits - a.totalVisits); break;
                    case "recent": filtered.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)); break;
                    case "orders": filtered.sort((a, b) => b.totalOrders - a.totalOrders); break;
                    case "name": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
                  }
                  return filtered.map((c) => (
                    <div key={c.phone} className="bg-white/[0.03] border border-white/[0.06] p-4 mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-white tracking-wide">{c.name}</p>
                          <p className="text-xs text-white/40">{c.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#C9AB81]">{formatPrice(c.totalSpent)}</p>
                          <p className="text-[10px] text-white/30">{c.totalVisits} vizite</p>
                        </div>
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

                      {/* Timeline */}
                      <div className="flex justify-between text-[10px] text-white/20">
                        <span>Prima vizită: {new Date(c.firstVisit).toLocaleDateString("ro-RO")}</span>
                        <span>Ultima: {new Date(c.lastVisit).toLocaleDateString("ro-RO")}</span>
                      </div>
                    </div>
                  ));
                })()}
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

function StatCard({ label, value, gold }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] p-4">
      <p className="text-[10px] text-white/30 font-bold tracking-[0.15em] uppercase mb-1">{label}</p>
      <p className={`text-2xl font-bold tracking-wide ${gold ? "text-[#C9AB81]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] p-8 text-center">
      <p className="text-white/30 text-sm">{text}</p>
    </div>
  );
}
