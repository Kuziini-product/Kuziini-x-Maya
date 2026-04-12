"use client";

import { useState } from "react";
import { ArrowLeft, Smartphone, Monitor, Clock, ChevronRight } from "lucide-react";
import type { AccessData, AccessUser } from "@/types/admin-dashboard";

interface AccessLogTabProps {
  accessData: AccessData | null;
  onlinePhones: Set<string>;
  accessUnread?: number;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="th-card border p-8 text-center">
      <p className="th-text-muted text-sm">{text}</p>
    </div>
  );
}

export default function AccessLogTab({ accessData, onlinePhones, accessUnread = 0 }: AccessLogTabProps) {
  const [selectedAccessUser, setSelectedAccessUser] = useState<AccessUser | null>(null);

  if (!accessData) {
    return <EmptyMsg text="Se încarcă datele..." />;
  }

  if (selectedAccessUser) {
    /* Detail view: user access history */
    return (
      <div>
        <button
          onClick={() => setSelectedAccessUser(null)}
          className="flex items-center gap-1.5 text-maya-gold text-xs font-bold tracking-wider uppercase mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Înapoi la lista
        </button>
        <div className={`bg-white/[0.03] border p-4 mb-4 ${onlinePhones.has(selectedAccessUser.phone) ? "border-emerald-500/40" : "th-border"}`}>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg th-text tracking-wide">{selectedAccessUser.name || "—"}</p>
            {onlinePhones.has(selectedAccessUser.phone) && (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold tracking-wider uppercase">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                Online
              </span>
            )}
          </div>
          <p className="text-xs th-text-secondary">{selectedAccessUser.phone}</p>
          {selectedAccessUser.email && <p className="text-xs text-maya-gold/70">{selectedAccessUser.email}</p>}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/[0.03] px-3 py-2 text-center">
              <p className="text-[9px] th-text-muted uppercase tracking-wider">Total accesări</p>
              <p className="text-xl font-bold text-white">{selectedAccessUser.totalAccess}</p>
            </div>
            <div className="bg-white/[0.03] px-3 py-2 text-center">
              <p className="text-[9px] th-text-muted uppercase tracking-wider">Prima accesare</p>
              <p className="text-xs font-bold text-white mt-1">{formatTime(selectedAccessUser.firstAccess)}</p>
            </div>
          </div>
        </div>

        <p className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Istoric accesări ({selectedAccessUser.pages.length})
        </p>
        <div className="space-y-2">
          {[...selectedAccessUser.pages].reverse().map((p, i) => (
            <div key={i} className="th-card border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                  p.action === "scan" ? "bg-emerald-500/20" :
                  p.action === "menu" ? "bg-blue-500/20" :
                  p.action === "menu-return" ? "bg-purple-500/20" :
                  "bg-gray-200"
                }`}>
                  {p.action === "scan" ? <Smartphone className="w-4 h-4 text-emerald-400" /> :
                   p.action === "menu" ? <Monitor className="w-4 h-4 text-blue-400" /> :
                   <Clock className="w-4 h-4 text-purple-400" />}
                </div>
                <div>
                  <p className="text-xs text-white font-bold">{p.page}</p>
                  <div className="flex items-center gap-2 text-[10px] th-text-muted">
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
                    {p.umbrellaId && <span className="text-maya-gold">⛱️ {p.umbrellaId}</span>}
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

  /* User list view */
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">
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
            className={`w-full p-4 mb-3 text-left active:th-tab-inactive transition-colors border ${
              isOnline
                ? "bg-emerald-500/[0.06] border-emerald-500/30"
                : "bg-white/[0.03] th-border"
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
                  <span className="text-[9px] bg-maya-gold/20 text-maya-gold px-1.5 py-0.5 font-bold">
                    {u.totalAccess}×
                  </span>
                  {isOnline && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold tracking-wider uppercase">
                      Online
                    </span>
                  )}
                </div>
                <p className="text-xs th-text-muted">{u.phone}</p>
                {u.email && <p className="text-xs text-maya-gold/60">{u.email}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] th-text-secondary">
                  <span>Prima: {formatTime(u.firstAccess)}</span>
                  <span>Ultima: {formatTime(u.lastAccess)}</span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ml-2 ${isOnline ? "text-emerald-400/40" : "th-text-faint"}`} />
            </div>
          </button>
          );
        })
      )}
    </>
  );
}
