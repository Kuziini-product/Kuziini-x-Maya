"use client";

import { Eye, Trash2 } from "lucide-react";
import type { OfferEntry } from "@/types/admin-dashboard";
import type { GalleryImage } from "@/lib/mock-data";

interface OffersTabProps {
  offers: OfferEntry[];
  onUpdate: () => void;
  galleryImages?: GalleryImage[];
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OffersTab({ offers, onUpdate, galleryImages = [] }: OffersTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="th-text-muted text-xs">
          {offers.length} solicitări
          {offers.filter((o) => !o.read).length > 0 && (
            <span className="ml-2 text-maya-gold font-bold">
              ({offers.filter((o) => !o.read).length} noi)
            </span>
          )}
        </p>
      </div>
      {offers.length === 0 ? (
        <EmptyMsg text="Nicio solicitare de ofertă." />
      ) : (
        offers.map((o) => (
          <div
            key={o.id}
            className={`bg-white/[0.03] border p-4 ${
              o.read ? "th-border" : "border-maya-gold/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {(() => {
                const indexes = o.photoIndexes || (o.photoIndex !== undefined ? [o.photoIndex] : []);
                if (indexes.length > 0 && galleryImages.length > 0) {
                  return (
                    <div className="flex gap-1 shrink-0">
                      {indexes.map((idx) => galleryImages[idx] ? (
                        <img
                          key={idx}
                          src={galleryImages[idx].url}
                          alt={`Foto #${idx + 1}`}
                          className="w-14 h-14 object-cover border border-white/[0.08]"
                        />
                      ) : null)}
                    </div>
                  );
                }
                if (o.photoUrl) {
                  return <img src={o.photoUrl} alt="" className="w-16 h-16 object-cover shrink-0 border border-white/[0.08]" />;
                }
                return null;
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm th-text tracking-wide">
                    {o.name}
                    {!o.read && (
                      <span className="ml-2 text-[8px] bg-maya-gold text-maya-dark px-1.5 py-0.5 font-bold tracking-wider uppercase">
                        NOU
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] text-white/70 shrink-0">{formatTime(o.timestamp)}</span>
                </div>
                <p className="text-xs th-text-secondary">{o.phone}</p>
                <p className="text-xs text-maya-gold/70">{o.email}</p>
                {o.message && (
                  <p className="text-xs th-text-muted mt-1 italic">&ldquo;{o.message}&rdquo;</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {!o.read && (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/offers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "markRead", offerId: o.id }),
                    });
                    const json = await res.json();
                    if (json.success) onUpdate();
                  }}
                  className="flex items-center gap-1.5 th-tab-inactive px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase th-text-secondary"
                >
                  <Eye className="w-3 h-3" />
                  Marchează citit
                </button>
              )}
              <button
                onClick={async () => {
                  const res = await fetch("/api/offers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "delete", offerId: o.id }),
                  });
                  const json = await res.json();
                  if (json.success) onUpdate();
                }}
                className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-red-400"
              >
                <Trash2 className="w-3 h-3" />
                Șterge
              </button>
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
