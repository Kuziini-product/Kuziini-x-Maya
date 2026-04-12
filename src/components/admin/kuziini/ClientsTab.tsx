"use client";

import { useState } from "react";
import { Heart, ArrowUpDown, ChevronRight, ArrowLeft, Eye, FileText } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type {
  AnalyticsData,
  GalleryStatsData,
  GalleryUserStat,
  ClientSort,
  ClientFilter,
  AccessData,
} from "@/types/admin-dashboard";

interface ClientsTabProps {
  analyticsData: AnalyticsData | null;
  galleryStats: GalleryStatsData | null;
  onlinePhones: Set<string>;
  accessData?: AccessData | null;
  initialSearch?: string;
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

function StatCard({ label, value, gold }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="th-card border p-4 text-left">
      <p className="text-[10px] th-text-muted font-bold tracking-[0.15em] uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-wide ${gold ? "text-maya-gold" : "th-text"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="th-card border p-8 text-center">
      <p className="th-text-muted text-sm">{text}</p>
    </div>
  );
}

export default function ClientsTab({ analyticsData, galleryStats, onlinePhones, accessData, initialSearch = "" }: ClientsTabProps) {
  const [clientSort, setClientSort] = useState<ClientSort>("spent");
  const [clientSearch, setClientSearch] = useState(initialSearch);
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [selectedGalleryUser, setSelectedGalleryUser] = useState<GalleryUserStat | null>(null);

  if (!analyticsData) {
    return <EmptyMsg text="Se încarcă datele..." />;
  }

  if (selectedGalleryUser) {
    /* Gallery user detail view */
    return (
      <div>
        <button
          onClick={() => setSelectedGalleryUser(null)}
          className="flex items-center gap-1.5 text-maya-gold text-xs font-bold tracking-wider uppercase mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Înapoi
        </button>
        <div className="th-card border p-4 mb-4">
          <p className="font-bold text-lg th-text tracking-wide">{selectedGalleryUser.sessionId.slice(0, 20)}...</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white/[0.03] px-2 py-2 text-center">
              <p className="text-[9px] th-text-muted uppercase tracking-wider">Poze văzute</p>
              <p className="text-xl font-bold text-white">{selectedGalleryUser.photosViewed}</p>
            </div>
            <div className="bg-white/[0.03] px-2 py-2 text-center">
              <p className="text-[9px] th-text-muted uppercase tracking-wider">Timp total</p>
              <p className="text-xl font-bold text-white">{formatDuration(selectedGalleryUser.totalTimeSpent)}</p>
            </div>
            <div className="bg-white/[0.03] px-2 py-2 text-center">
              <p className="text-[9px] th-text-muted uppercase tracking-wider">Like-uri</p>
              <p className="text-xl font-bold text-red-400">{selectedGalleryUser.likes}</p>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-white/70 mt-3">
            <span>Prima vizită: {formatTime(selectedGalleryUser.firstView)}</span>
            <span>Ultima: {formatTime(selectedGalleryUser.lastView)}</span>
          </div>
        </div>

        <p className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Poze accesate ({selectedGalleryUser.photoDetails.length})
        </p>
        <div className="space-y-2">
          {[...selectedGalleryUser.photoDetails].reverse().map((p, i) => (
            <div key={i} className="th-card border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 shrink-0">
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Poza #{p.photoIndex + 1}</p>
                  <div className="flex items-center gap-2 text-[10px] th-text-muted">
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
    );
  }

  return (
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
        <div className="th-card border p-4 mb-4">
          <h3 className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5" />
            Statistici Galerie
          </h3>

          {/* Total time spent */}
          <div className="bg-white/[0.03] p-3 mb-3 text-center">
            <p className="text-[9px] th-text-muted uppercase tracking-wider mb-1">Timp total vizualizare</p>
            <p className="text-xl font-bold text-maya-gold">{formatDuration(galleryStats.totalTimeSpent)}</p>
          </div>

          {/* Photo breakdown */}
          <p className="th-text-muted text-[10px] font-bold tracking-wider uppercase mb-2">Per poză</p>
          <div className="space-y-2 mb-4">
            {galleryStats.photos.map((p) => (
              <div key={p.index} className="bg-white/[0.02] p-2.5 flex items-center justify-between">
                <span className="th-text-secondary text-xs font-bold">Poza #{p.index + 1}</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="th-text-muted">{p.views} vizualizări</span>
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
          <p className="th-text-muted text-[10px] font-bold tracking-wider uppercase mb-2 text-center">Vizualizări pe ore</p>
          <div className="flex items-end justify-center gap-0.5 h-16 mb-1 mx-auto max-w-full">
            {galleryStats.hourlyViews.map((count, hour) => {
              const max = Math.max(...galleryStats.hourlyViews, 1);
              const h = Math.max((count / max) * 100, count > 0 ? 8 : 2);
              return (
                <div
                  key={hour}
                  className={`flex-1 rounded-t-sm transition-all ${count > 0 ? "bg-maya-gold" : "bg-gray-200"}`}
                  style={{ height: `${h}%` }}
                  title={`${hour}:00 — ${count} vizualizări`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] th-text-faint px-0">
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
          <p className="th-text-muted text-[10px] font-bold tracking-wider uppercase mt-4 mb-2">
            Vizitatori unici ({galleryStats.users.length})
          </p>
          <div className="space-y-2">
            {galleryStats.users.map((u) => (
              <button
                key={u.sessionId}
                onClick={() => setSelectedGalleryUser(u)}
                className="w-full bg-white/[0.02] p-3 text-left active:th-tab-inactive transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white font-bold">{u.sessionId.slice(0, 24)}...</p>
                    <div className="flex items-center gap-3 text-[10px] th-text-muted mt-1">
                      <span>{u.photosViewed} poze</span>
                      <span className="text-blue-400">{formatDuration(u.totalTimeSpent)}</span>
                      {u.likes > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <Heart className="w-2.5 h-2.5 fill-red-400" />
                          {u.likes}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] th-text-secondary mt-0.5">
                      {formatTime(u.firstView)} — {formatTime(u.lastView)}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 th-text-faint shrink-0" />
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
                ? "bg-maya-gold text-maya-dark"
                : "th-tab-inactive th-text-muted"
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
          className="flex-1 th-tab-inactive border th-border px-3 py-2 text-white text-xs placeholder:text-gray-400 outline-none focus:border-maya-gold/50"
        />
        <button
          onClick={() => {
            const sorts: ClientSort[] = ["spent", "visits", "recent", "orders", "name"];
            const idx = sorts.indexOf(clientSort);
            setClientSort(sorts[(idx + 1) % sorts.length]);
          }}
          className="flex items-center gap-1.5 th-tab-inactive border th-border px-3 py-2 text-[10px] font-bold tracking-wider uppercase th-text-secondary"
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
          <p className="th-text-muted text-xs mb-3">
            {filtered.length} clienți
            {clientFilter !== "all" && ` (filtru: ${clientFilter === "receptie" ? "recepție" : "cereri ofertă"})`}
          </p>
          {filtered.map((c) => {
            const isOnline = onlinePhones.has(c.phone);
            return (
          <div key={c.phone} className={`p-4 mb-3 border ${isOnline ? "bg-emerald-500/[0.06] border-emerald-500/30" : "bg-white/[0.03] th-border"}`}>
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
                <p className="text-xs th-text-muted">{c.phone}</p>
                {c.email && <p className="text-xs text-maya-gold/70">{c.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-maya-gold">{formatPrice(c.totalSpent)}</p>
                <p className="text-[10px] th-text-muted">{c.totalVisits} vizite</p>
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
                <span className="text-[9px] bg-maya-gold/20 text-maya-gold px-2 py-0.5 font-bold tracking-wider uppercase">
                  Cerere ofertă
                </span>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                <p className="text-[9px] th-text-muted uppercase tracking-wider">Comenzi</p>
                <p className="text-sm font-bold text-white">{c.totalOrders}</p>
              </div>
              <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                <p className="text-[9px] th-text-muted uppercase tracking-wider">Medie/vizită</p>
                <p className="text-sm font-bold text-white">{formatPrice(c.avgPerVisit)}</p>
              </div>
              <div className="bg-white/[0.03] px-2 py-1.5 text-center">
                <p className="text-[9px] th-text-muted uppercase tracking-wider">Oferte</p>
                <p className="text-sm font-bold text-white">{c.offerRequests}</p>
              </div>
            </div>

            {/* Payment methods */}
            {Object.keys(c.paymentMethods).length > 0 && (
              <div className="flex gap-2 mb-2">
                {Object.entries(c.paymentMethods).map(([method, count]) => (
                  <span key={method} className="text-[10px] th-tab-inactive px-2 py-1 th-text-secondary capitalize">
                    {method}: {count}
                  </span>
                ))}
              </div>
            )}

            {/* Umbrellas used */}
            {c.umbrellas.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {c.umbrellas.map((u) => (
                  <span key={u} className="text-[10px] bg-maya-gold/10 text-maya-gold/70 px-1.5 py-0.5">
                    ⛱️ {u}
                  </span>
                ))}
              </div>
            )}

            {/* Offer details */}
            {c.offerDetails.length > 0 && (
              <div className="border-t th-border pt-2 mt-2 space-y-1.5">
                <p className="text-[9px] text-maya-gold font-bold tracking-wider uppercase">Solicitări ofertă</p>
                {c.offerDetails.map((od, oi) => (
                  <div key={oi} className="flex items-start gap-2 bg-white/[0.02] p-2">
                    {od.photoUrl && !od.photoUrl.startsWith("[") && (
                      <img src={od.photoUrl} alt="" className="w-10 h-10 object-cover shrink-0 border border-white/[0.08]" />
                    )}
                    <div className="flex-1 min-w-0">
                      {od.message && <p className="text-[10px] th-text-secondary italic">&ldquo;{od.message}&rdquo;</p>}
                      <p className="text-[9px] th-text-secondary">{formatTime(od.timestamp)}</p>
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
                lines.push("Kuziini × Maya — Admin Panel");
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
              className="w-full mt-3 flex items-center justify-center gap-2 bg-maya-gold/15 border border-maya-gold/30 text-maya-gold py-2 text-[10px] font-bold tracking-wider uppercase active:bg-maya-gold/25 transition-colors"
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
  );
}
