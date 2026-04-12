"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ALL_UMBRELLAS } from "@/lib/umbrella-config";
import SectionHelp from "@/components/SectionHelp";

interface UmbrellaQR {
  id: string;
  zone: string;
}

export default function QRCodeManager() {
  const [umbrellas, setUmbrellas] = useState<UmbrellaQR[]>(
    ALL_UMBRELLAS.map((u) => ({ id: u.id, zone: u.zone }))
  );
  const [newId, setNewId] = useState("");
  const [newZone, setNewZone] = useState("Zona Lounge");
  const printRef = useRef<HTMLDivElement>(null);

  function addUmbrella() {
    const trimmed = newId.trim().toUpperCase();
    if (!trimmed) return;
    if (umbrellas.some((u) => u.id === trimmed)) return;
    setUmbrellas((prev) => [...prev, { id: trimmed, zone: newZone }]);
    setNewId("");
  }

  function removeUmbrella(id: string) {
    setUmbrellas((prev) => prev.filter((u) => u.id !== id));
  }

  const downloadQR = useCallback((umbrellaId: string, zone: string) => {
    const svg = document.getElementById(`qr-${umbrellaId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 40;
    const qrSize = 300;
    const textHeight = 80;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      ctx.fillStyle = "#0A0A0A";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(umbrellaId, canvas.width / 2, qrSize + padding + 35);
      ctx.fillStyle = "#888888";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(zone, canvas.width / 2, qrSize + padding + 60);
      const link = document.createElement("a");
      link.download = `QR-${umbrellaId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  function printAllQRs() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrCards = umbrellas.map((u) => {
      const svg = document.getElementById(`qr-${u.id}`);
      const svgHtml = svg ? new XMLSerializer().serializeToString(svg) : "";
      return `
        <div style="display:inline-block;width:200px;margin:15px;text-align:center;page-break-inside:avoid;border:1px solid #ddd;padding:20px;border-radius:8px;">
          <div style="background:white;padding:10px;display:inline-block;">${svgHtml}</div>
          <p style="font-size:22px;font-weight:bold;margin:10px 0 2px;font-family:Arial,sans-serif;">${u.id}</p>
          <p style="font-size:13px;color:#888;margin:0;font-family:Arial,sans-serif;">${u.zone}</p>
          <p style="font-size:10px;color:#bbb;margin-top:6px;font-family:Arial,sans-serif;">kuziini.app</p>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR Codes - Maya</title></head>
      <body style="text-align:center;padding:20px;font-family:Arial,sans-serif;">
        <h2 style="margin-bottom:20px;">QR Codes Umbrele - Maya × Kuziini</h2>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;">
          ${qrCards.join("")}
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">QR codes pentru umbrele</p>
        <SectionHelp items={[
          "Fiecare umbrela are un QR code unic care duce clientul la pagina de comanda.",
          "Adauga o umbrela noua introducand ID-ul (ex: C-01) si selectand zona.",
          "Apasa 'Salveaza' pe fiecare QR pentru a-l descarca ca imagine PNG.",
          "Apasa 'Printeaza toate' pentru a deschide o pagina de print cu toate QR-urile.",
        ]} />
      </div>

      {/* Add umbrella */}
      <div className="th-card border p-4 mb-4">
        <p className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Adauga umbrela
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="ID (ex: C-01)"
            className="flex-1 th-input border th-border px-3 py-2 text-sm outline-none focus:border-maya-gold/50"
            onKeyDown={(e) => e.key === "Enter" && addUmbrella()}
          />
          <select
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            className="th-input border th-border px-3 py-2 text-sm outline-none focus:border-maya-gold/50"
          >
            <option value="Zona Lounge">Zona Lounge</option>
            <option value="Zona Beach">Zona Beach</option>
            <option value="VIP Premium">VIP Premium</option>
          </select>
        </div>
        <button
          onClick={addUmbrella}
          className="w-full flex items-center justify-center gap-2 bg-maya-gold text-maya-dark py-2 font-bold text-xs tracking-wider uppercase"
        >
          <Plus className="w-3.5 h-3.5" />
          Adauga
        </button>
      </div>

      {/* Print all button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={printAllQRs}
          className="flex-1 flex items-center justify-center gap-2 th-tab-inactive border border-white/[0.1] py-2.5 th-text-muted text-xs font-bold tracking-wider uppercase active:bg-white/[0.1] transition-colors"
        >
          <Printer className="w-4 h-4" />
          Printeaza toate ({umbrellas.length})
        </button>
      </div>

      <p className="th-text-muted text-xs mb-3">{umbrellas.length} umbrele</p>

      {/* QR Grid */}
      <div ref={printRef} className="grid grid-cols-2 gap-3">
        {umbrellas.map((u) => (
          <div
            key={u.id}
            className="th-card border p-4 flex flex-col items-center"
          >
            <div className="bg-white p-2 mb-3">
              <QRCodeSVG
                id={`qr-${u.id}`}
                value={`https://kuziini.app/u/${u.id}`}
                size={100}
                level="M"
              />
            </div>
            <p className="font-bold text-sm th-text tracking-wide">{u.id}</p>
            <p className="text-maya-gold text-[10px] tracking-wider uppercase mb-3">
              {u.zone}
            </p>

            <div className="flex gap-1.5 w-full">
              <button
                onClick={() => downloadQR(u.id, u.zone)}
                className="flex-1 flex items-center justify-center gap-1 bg-maya-gold text-maya-dark py-1.5 text-[10px] font-bold tracking-wider uppercase"
              >
                <Download className="w-3 h-3" />
                Salveaza
              </button>
              <button
                onClick={() => removeUmbrella(u.id)}
                className="w-8 flex items-center justify-center bg-red-500/10 text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
