"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Umbrella,
  Users,
  Clock,
  MapPin,
  CreditCard,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface Props {
  adminId: string;
  onNavigate?: (tab: string) => void;
}

interface StatCardDef {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  tab?: string;
}

export default function GuestDashboard({ adminId, onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      const json = await res.json();
      if (json.success) setStats(json.data.stats);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const cards: StatCardDef[] = [
    {
      label: "Sezlonguri ocupate",
      value: stats.loungersInUse,
      icon: <Umbrella className="w-6 h-6" />,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
      tab: "guest-loungers",
    },
    {
      label: "Oaspeti activi",
      value: stats.activeGuests,
      icon: <Users className="w-6 h-6" />,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
      tab: "guest-list",
    },
    {
      label: "Comenzi nelivrate",
      value: stats.pendingOrders,
      icon: <Clock className="w-6 h-6" />,
      color: stats.pendingOrders > 0 ? "text-red-400" : "text-gray-600",
      bg: stats.pendingOrders > 0
        ? "bg-red-400/10 border-red-400/20"
        : "bg-gray-100/80 border-gray-200",
      tab: "orders",
    },
    {
      label: "Locuri libere",
      value: stats.freeLoungers,
      icon: <MapPin className="w-6 h-6" />,
      color: "text-sky-400",
      bg: "bg-sky-400/10 border-sky-400/20",
      tab: "guest-loungers",
    },
    {
      label: "Total oaspeti azi",
      value: stats.totalGuestsToday,
      icon: <Users className="w-6 h-6" />,
      color: "text-[#C9AB81]",
      bg: "bg-[#C9AB81]/10 border-[#C9AB81]/20",
      tab: "guest-daily",
    },
    {
      label: "Cu credit activ",
      value: stats.creditGuestsCount,
      icon: <CreditCard className="w-6 h-6" />,
      color: "text-purple-400",
      bg: "bg-purple-400/10 border-purple-400/20",
      tab: "guest-list",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600 text-xs">
          {stats.totalLoungers} sezlonguri totale · Actualizare la 15s
        </p>
        <button
          onClick={() => { setLoading(true); fetchStats(); }}
          className="text-gray-600 active:text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => card.tab && onNavigate?.(card.tab)}
            className={`border p-4 flex flex-col items-center text-center cursor-pointer active:scale-[0.97] transition-transform ${card.bg}`}
          >
            <div className={card.color}>{card.icon}</div>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>
              {card.value}
            </p>
            <p className="text-gray-700 text-[10px] font-bold tracking-wider uppercase mt-1">
              {card.label}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-black/20 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
