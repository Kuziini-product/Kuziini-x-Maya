"use client";

import SectionHelp from "@/components/SectionHelp";
import type { LoginEntry } from "@/types/admin-dashboard";

interface LoginsTabProps {
  logins: LoginEntry[];
  onClientClick?: (phone: string) => void;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LoginsTab({ logins, onClientClick }: LoginsTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">{logins.length} inregistrari</p>
        <SectionHelp items={[
          "Aici vezi toate logarile clientilor prin QR code, in ordine cronologica.",
          "Fiecare intrare arata: numele clientului, numarul de telefon si umbrela scanata.",
          "Timestamp-ul din dreapta arata data si ora logarii.",
          "Foloseste butonul de refresh din header pentru a actualiza datele.",
        ]} />
      </div>
      {logins.length === 0 ? (
        <EmptyMsg text="Nicio logare înregistrată." />
      ) : (
        logins.map((l, i) => (
          <button key={i} className="th-card border p-4 w-full text-left active:scale-[0.99] transition-transform cursor-pointer" onClick={() => onClientClick?.(l.phone)}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm th-text tracking-wide">
                {l.name || "—"}
              </p>
              <span className="text-[10px] th-text-faint">{formatTime(l.timestamp)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs th-text-muted">
              <span>{l.phone}</span>
              {l.email && <span>{l.email}</span>}
              <span className="text-[#C9AB81]">⛱️ {l.umbrellaId}</span>
            </div>
          </button>
        ))
      )}
    </>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="th-card border p-8 text-center">
      <p className="th-text-muted text-sm">{text}</p>
    </div>
  );
}
