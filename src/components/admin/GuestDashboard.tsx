"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Umbrella,
  Users,
  Clock,
  MapPin,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface Props {
  adminId: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

export default function GuestDashboard({ adminId }: Props) {
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
        <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const cards: StatCard[] = [
    {
      label: "Sezlonguri ocupate",
      value: stats.loungersInUse,
      icon: <Umbrella className="w-6 h-6" />,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    {
      label: "Oaspeti activi",
      value: stats.activeGuests,
      icon: <Users className="w-6 h-6" />,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    },
    {
      label: "Comenzi nelivrate",
      value: stats.pendingOrders,
      icon: <Clock className="w-6 h-6" />,
      color: stats.pendingOrders > 0 ? "text-red-400" : "text-white/40",
      bg: stats.pendingOrders > 0
        ? "bg-red-400/10 border-red-400/20"
        : "bg-white/[0.03] border-white/[0.06]",
    },
    {
      label: "Locuri libere",
      value: stats.freeLoungers,
      icon: <MapPin className="w-6 h-6" />,
      color: "text-sky-400",
      bg: "bg-sky-400/10 border-sky-400/20",
    },
    {
      label: "Total oaspeti azi",
      value: stats.totalGuestsToday,
      icon: <Users className="w-6 h-6" />,
      color: "text-[#C9AB81]",
      bg: "bg-[#C9AB81]/10 border-[#C9AB81]/20",
    },
    {
      label: "Cu credit activ",
      value: stats.creditGuestsCount,
      icon: <CreditCard className="w-6 h-6" />,
      color: "text-purple-400",
      bg: "bg-purple-400/10 border-purple-400/20",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/30 text-xs">
          {stats.totalLoungers} sezlonguri totale · Actualizare la 15s
        </p>
        <button
          onClick={() => { setLoading(true); fetchStats(); }}
          className="text-white/40 active:text-white/60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`border p-4 flex flex-col items-center text-center ${card.bg}`}
          >
            <div className={card.color}>{card.icon}</div>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>
              {card.value}
            </p>
            <p className="text-white/50 text-[10px] font-bold tracking-wider uppercase mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
