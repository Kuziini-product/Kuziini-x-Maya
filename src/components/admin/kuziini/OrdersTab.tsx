"use client";

import { formatPrice } from "@/lib/utils";
import SectionHelp from "@/components/SectionHelp";
import type { OrderEntry } from "@/types/admin-dashboard";

interface OrdersTabProps {
  orders: OrderEntry[];
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

export default function OrdersTab({ orders, onClientClick }: OrdersTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">{orders.length} comenzi</p>
        <SectionHelp items={[
          "Lista tuturor comenzilor plasate de clienti, cu detalii complete.",
          "Fiecare comanda arata: ID comanda, telefon client, umbrela, produsele comandate si totalul.",
          "Comenzile sunt afisate in ordine cronologica inversa (cele mai recente primele).",
        ]} />
      </div>
      {orders.length === 0 ? (
        <EmptyMsg text="Nicio comandă înregistrată." />
      ) : (
        orders.map((o, i) => (
          <div key={i} className="th-card border p-4 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => onClientClick?.(o.phone)}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm th-text tracking-wide">
                {o.orderId}
              </p>
              <span className="text-[10px] th-text-faint">{formatTime(o.timestamp)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs th-text-muted mb-2">
              <span>{o.phone}</span>
              <span className="text-[#C9AB81]">⛱️ {o.umbrellaId}</span>
            </div>
            <div className="space-y-1">
              {o.items.map((item, j) => (
                <div key={j} className="flex justify-between text-xs th-text-secondary">
                  <span>{item.quantity}× {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t th-border">
              <span className="text-xs th-text-muted">Total</span>
              <span className="text-sm font-bold text-[#C9AB81]">{formatPrice(o.total)}</span>
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
