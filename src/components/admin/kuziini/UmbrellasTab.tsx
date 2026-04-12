"use client";

import SectionHelp from "@/components/SectionHelp";
import type { UmbrellaInfo } from "@/types/admin-dashboard";

interface UmbrellasTabProps {
  umbrellas: UmbrellaInfo[];
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UmbrellasTab({ umbrellas }: UmbrellasTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">{umbrellas.length} umbrele</p>
        <SectionHelp items={[
          "Aici vezi statusul tuturor umbrelelor inregistrate in sistem.",
          "Verde 'Ocupat' = umbrela are o sesiune activa (un client a scanat QR-ul).",
          "Gri 'Liber' = umbrela este disponibila, niciun client nu a scanat QR-ul.",
          "Informatiile arata: numarul de telefon al clientului si ora la care a inceput sesiunea.",
          "Zona umbrelelei (Lounge, Beach, VIP) ajuta la organizarea spatiului.",
        ]} />
      </div>
      {umbrellas.map((u) => (
        <div key={u.id} className="th-card border p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">⛱️</span>
              <p className="font-bold text-sm th-text tracking-wide">{u.id}</p>
            </div>
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 ${
                u.hasSession
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-200 th-text-muted"
              }`}
            >
              {u.hasSession ? "Ocupat" : "Liber"}
            </span>
          </div>
          <p className="text-xs text-maya-gold tracking-wider uppercase">{u.zone}</p>
          {u.ownerPhone && (
            <p className="text-xs th-text-muted mt-1">{u.ownerPhone}</p>
          )}
          {u.sessionStarted && (
            <p className="text-[10px] th-text-faint mt-0.5">
              Din {formatTime(u.sessionStarted)}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
