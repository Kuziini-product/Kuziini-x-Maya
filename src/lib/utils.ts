import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "RON"): string {
  return `${amount.toFixed(0)} ${currency}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "În așteptare",
    sent: "Trimisă",
    confirmed: "Confirmată",
    preparing: "Se prepară",
    delivering: "Pe drum",
    delivered: "Livrată",
    rejected: "Respinsă",
    cancelled: "Anulată",
  };
  return labels[status] ?? status;
}

export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: "text-sand-600 bg-sand-100",
    sent: "text-ocean-600 bg-ocean-100",
    confirmed: "text-ocean-700 bg-ocean-100",
    preparing: "text-amber-700 bg-amber-100",
    delivering: "text-purple-700 bg-purple-100",
    delivered: "text-emerald-700 bg-emerald-100",
    rejected: "text-red-700 bg-red-100",
    cancelled: "text-gray-600 bg-gray-100",
  };
  return colors[status] ?? "text-gray-600 bg-gray-100";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

