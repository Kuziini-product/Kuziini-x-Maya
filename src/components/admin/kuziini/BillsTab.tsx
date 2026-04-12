"use client";

import { formatPrice } from "@/lib/utils";
import SectionHelp from "@/components/SectionHelp";
import type { BillEntry } from "@/types/admin-dashboard";

interface BillsTabProps {
  billRequests: BillEntry[];
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BillsTab({ billRequests }: BillsTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">{billRequests.length} note solicitate</p>
        <SectionHelp items={[
          "Aici vezi toate cererile de nota de plata trimise de clienti.",
          "Fiecare cerere arata: umbrela, metoda de plata aleasa si suma totala.",
          "Cand un client apasa 'Cere nota' din aplicatie, cererea apare aici automat.",
        ]} />
      </div>
      {billRequests.length === 0 ? (
        <EmptyMsg text="Nicio notă solicitată." />
      ) : (
        billRequests.map((b, i) => (
          <div key={i} className="th-card border p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm th-text tracking-wide">
                ⛱️ {b.umbrellaId}
              </p>
              <p className="text-xs th-text-muted mt-0.5 capitalize">{b.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-maya-gold">{formatPrice(b.amount)}</p>
              <p className="text-[10px] text-white/70">{formatTime(b.timestamp)}</p>
            </div>
          </div>
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
