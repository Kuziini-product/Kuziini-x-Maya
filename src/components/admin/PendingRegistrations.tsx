"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  AlertCircle,
  QrCode,
  Download,
  Printer,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { GuestProfile } from "@/types";
import GuestCardModal from "@/components/admin/GuestCardModal";

interface Props {
  adminId: string;
}

function getRegisterUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/register`;
  }
  return "/register";
}

export default function PendingRegistrations({ adminId }: Props) {
  const [pending, setPending] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestProfile | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pending-list", adminId }),
      });
      const json = await res.json();
      if (json.success) setPending(json.data);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchPending]);

  async function approve(guestId: string) {
    setProcessing(guestId);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-registration", adminId, guestId }),
      });
      const json = await res.json();
      if (json.success) {
        // Open card modal to assign lounger
        setEditingGuest(json.data);
        fetchPending();
      }
    } finally {
      setProcessing(null);
    }
  }

  async function reject(guestId: string) {
    if (!confirm("Respingi aceasta inregistrare?")) return;
    setProcessing(guestId);
    try {
      await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject-registration", adminId, guestId }),
      });
      fetchPending();
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-6 h-6 th-text-muted animate-spin" />
      </div>
    );
  }

  const registerUrl = getRegisterUrl();

  function downloadQR() {
    const svg = document.getElementById("reception-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const padding = 50;
    const qrSize = 400;
    const textHeight = 120;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      ctx.fillStyle = "#0A0A0A";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("INREGISTRARE OASPETI", canvas.width / 2, qrSize + padding + 40);
      ctx.fillStyle = "#C9AB81";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText("Maya × Kuziini", canvas.width / 2, qrSize + padding + 70);
      ctx.fillStyle = "#888888";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText("Scaneaza pentru a te inregistra", canvas.width / 2, qrSize + padding + 100);
      const link = document.createElement("a");
      link.download = "QR-Inregistrare-Receptie.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function printQR() {
    const svg = document.getElementById("reception-qr");
    if (!svg) return;
    const svgHtml = new XMLSerializer().serializeToString(svg);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Inregistrare</title></head>
      <body style="text-align:center;padding:40px;font-family:Arial,sans-serif;">
        <div style="display:inline-block;border:2px solid #C9AB81;padding:40px;border-radius:12px;">
          <div style="background:white;padding:20px;display:inline-block;">${svgHtml}</div>
          <h1 style="font-size:28px;margin:20px 0 5px;color:#0A0A0A;">INREGISTRARE OASPETI</h1>
          <p style="font-size:18px;color:#C9AB81;font-weight:bold;margin:0 0 10px;">Maya × Kuziini</p>
          <p style="font-size:14px;color:#888;margin:0 0 5px;">Scaneaza codul QR cu telefonul</p>
          <p style="font-size:14px;color:#888;margin:0;">pentru a te inregistra la receptie</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#aaa;">1. Completeaza datele personale</p>
          <p style="font-size:11px;color:#aaa;">2. Daca esti intr-o familie, alatura-te grupului</p>
          <p style="font-size:11px;color:#aaa;">3. Receptia va valida si aloca locul</p>
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    w.document.close();
  }

  return (
    <div>
      {/* QR Code section */}
      <div className="th-card border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#C9AB81]" />
            <p className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em]">
              QR Code Receptie
            </p>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="th-text-muted text-xs font-bold"
          >
            {showQR ? "Ascunde" : "Arata"}
          </button>
        </div>

        {showQR && (
          <div className="text-center">
            <div className="bg-white p-4 inline-block mb-3 border border-gray-200">
              <QRCodeSVG
                id="reception-qr"
                value={registerUrl}
                size={200}
                level="H"
              />
            </div>
            <p className="th-text-muted text-xs mb-1">
              Oaspetii scaneaza acest cod la receptie
            </p>
            <p className="th-text-faint text-[10px] mb-4 break-all">
              {registerUrl}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={downloadQR}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C9AB81] text-[#0A0A0A] font-bold text-[10px] tracking-wider uppercase"
              >
                <Download className="w-3.5 h-3.5" />
                Descarca PNG
              </button>
              <button
                onClick={printQR}
                className="flex items-center gap-1.5 px-4 py-2 th-tab-inactive th-text-muted font-bold text-[10px] tracking-wider uppercase"
              >
                <Printer className="w-3.5 h-3.5" />
                Printeaza
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending list header */}
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">
          {pending.length} {pending.length === 1 ? "cerere" : "cereri"} de validare
        </p>
        <button onClick={() => { setLoading(true); fetchPending(); }} className="th-text-muted">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="th-card border p-8 text-center">
          <Check className="w-10 h-10 th-text-faint mx-auto mb-2" />
          <p className="th-text-muted text-sm">Nicio cerere de validare.</p>
          <p className="th-text-faint text-xs mt-1">Oaspetii care scaneaza QR-ul de la receptie vor aparea aici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((g) => {
            const members = g.members || [{ phone: g.phone, name: g.name, email: g.email }];
            const expectedSize = g.groupSize || 1;
            const currentSize = members.length;
            const isGroupComplete = currentSize >= expectedSize;
            const isGroup = expectedSize > 1;

            return (
              <div key={g.id} className={`th-card border p-4 ${isGroup && !isGroupComplete ? "border-l-4 border-l-orange-400" : isGroup && isGroupComplete ? "border-l-4 border-l-emerald-400" : ""}`}>
                {/* Guest info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="th-text font-bold text-base">{g.name}</p>
                    <div className="flex items-center gap-3 text-xs th-text-muted mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {g.phone}</span>
                      {g.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {g.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isGroup && (
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 ${
                        isGroupComplete
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-orange-100 text-orange-600"
                      }`}>
                        {currentSize}/{expectedSize}
                      </span>
                    )}
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-amber-100 text-amber-600">
                      Pending
                    </span>
                  </div>
                </div>

                {/* Stay period */}
                <div className="flex items-center gap-2 text-xs th-text-muted mb-2">
                  <Calendar className="w-3 h-3" />
                  {g.stayStart} → {g.stayEnd}
                </div>

                {/* Group status */}
                {isGroup && (
                  <div className={`p-2.5 mb-3 border ${isGroupComplete ? "bg-emerald-400/5 border-emerald-400/20" : "bg-orange-400/5 border-orange-400/20"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className={`text-xs font-bold ${isGroupComplete ? "text-emerald-500" : "text-orange-500"}`}>
                        {isGroupComplete ? "Grup complet" : `Se asteapta ${expectedSize - currentSize} ${expectedSize - currentSize === 1 ? "membru" : "membri"}`}
                      </span>
                    </div>
                    {/* Member list */}
                    <div className="space-y-1">
                      {members.map((m, i) => (
                        <div key={m.phone} className="flex items-center gap-2 text-xs th-text-muted">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="font-medium">{m.name}</span>
                          <span className="th-text-faint">{m.phone}</span>
                        </div>
                      ))}
                      {/* Empty slots */}
                      {Array.from({ length: Math.max(0, expectedSize - currentSize) }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex items-center gap-2 text-xs text-orange-400/50">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="italic">In asteptare...</span>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isGroupComplete ? "bg-emerald-400" : "bg-orange-400"}`}
                        style={{ width: `${Math.min(100, (currentSize / expectedSize) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Single member info */}
                {!isGroup && members.length > 1 && (
                  <div className="flex items-center gap-2 text-xs th-text-muted mb-3">
                    <Users className="w-3 h-3" />
                    {members.length} membri: {members.map(m => m.name.split(" ")[0]).join(", ")}
                  </div>
                )}

                {/* Registration time */}
                <p className="th-text-faint text-[10px] mb-3">
                  Inregistrat: {new Date(g.registeredAt).toLocaleString("ro-RO")}
                  {g.registeredBy === "self" && " (self-service)"}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(g.id)}
                    disabled={processing === g.id || (isGroup && !isGroupComplete)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-40 ${
                      isGroup && !isGroupComplete
                        ? "th-tab-inactive th-text-muted cursor-not-allowed"
                        : "bg-emerald-500 text-white"
                    }`}
                    title={isGroup && !isGroupComplete ? "Asteapta ca toti membrii sa se inregistreze" : ""}
                  >
                    <Check className="w-4 h-4" />
                    {processing === g.id ? "..." : isGroup && !isGroupComplete ? `Asteapta ${expectedSize - currentSize} membri` : "Valideaza"}
                  </button>
                  <button
                    onClick={() => reject(g.id)}
                    disabled={processing === g.id}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs tracking-wider uppercase"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card modal for editing after approval */}
      {editingGuest && (
        <GuestCardModal
          guest={editingGuest}
          adminId={adminId}
          onClose={() => { setEditingGuest(null); fetchPending(); }}
          onUpdated={(g) => setEditingGuest(g)}
        />
      )}
    </div>
  );
}
