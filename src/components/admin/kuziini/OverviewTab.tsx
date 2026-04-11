"use client";

import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import SectionHelp from "@/components/SectionHelp";
import type { AdminData, Tab } from "@/types/admin-dashboard";

interface OverviewTabProps {
  data: AdminData;
  onNavigate?: (tab: Tab) => void;
}

export default function OverviewTab({ data, onNavigate }: OverviewTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">Statistici generale</p>
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
        <StatCard label="Total logări" value={data.stats.totalLogins} onClick={onNavigate ? () => onNavigate("logins") : undefined} />
        <StatCard label="Utilizatori unici" value={data.stats.uniquePhones} onClick={onNavigate ? () => onNavigate("rapoarte") : undefined} />
        <StatCard label="Total comenzi" value={data.stats.totalOrders} onClick={onNavigate ? () => onNavigate("orders") : undefined} />
        <StatCard label="Venit total" value={formatPrice(data.stats.totalRevenue)} gold onClick={onNavigate ? () => onNavigate("bills") : undefined} />
        <StatCard label="Note solicitate" value={data.stats.totalBillRequests} onClick={onNavigate ? () => onNavigate("bills") : undefined} />
        <StatCard
          label="Umbrele active"
          value={data.umbrellas.filter((u) => u.hasSession).length}
          onClick={onNavigate ? () => onNavigate("umbrellas") : undefined}
        />
      </div>

      {Object.keys(data.stats.paymentBreakdown).length > 0 && (
        <div className="th-card border p-4">
          <h3 className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
            Metode de plată
          </h3>
          {Object.entries(data.stats.paymentBreakdown).map(([method, count]) => (
            <div key={method} className="flex justify-between text-sm py-1">
              <span className="th-text-secondary capitalize">{method}</span>
              <span className="th-text font-bold">{count}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, gold, onClick }: { label: string; value: string | number; gold?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`th-card border p-4 text-left ${onClick ? "active:th-tab-inactive transition-colors cursor-pointer" : ""}`}
    >
      <p className="text-[10px] th-text-muted font-bold tracking-[0.15em] uppercase mb-1">
        {label}
        {onClick && <ChevronRight className="w-3 h-3 inline ml-1 opacity-40" />}
      </p>
      <p className={`text-2xl font-bold tracking-wide ${gold ? "text-[#C9AB81]" : "th-text"}`}>
        {value}
      </p>
    </Tag>
  );
}
