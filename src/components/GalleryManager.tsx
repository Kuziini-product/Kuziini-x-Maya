"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, ImageIcon, X, Upload, FolderOpen, GripVertical } from "lucide-react";
import type { BannerCategory } from "@/types";
import type { GalleryImage, GalleryAspect, LibraryPhoto } from "@/lib/mock-data";

interface GalleryManagerProps {
  category: BannerCategory;
  password: string;
  slots: number;
  aspect: GalleryAspect;
  images: GalleryImage[];
  library: LibraryPhoto[];
  onUpdate: (data: { slots: number; aspect: GalleryAspect; images: GalleryImage[]; library: LibraryPhoto[] }) => void;
}

const SLOT_OPTIONS = [1, 2, 3, 4, 6];
const ASPECT_OPTIONS: { value: GalleryAspect; label: string }[] = [
  { value: "square", label: "Pătrat" },
  { value: "portrait", label: "Portret" },
  { value: "landscape", label: "Peisaj" },
];

function getAspectClass(aspect: GalleryAspect): string {
  switch (aspect) {
    case "portrait": return "aspect-[3/4]";
    case "landscape": return "aspect-[4/3]";
    default: return "aspect-square";
  }
}

/** Resize image client-side: max 600px longest side, JPEG quality 0.55
 *  Keeps base64 small enough for Vercel KV (Upstash) storage limits */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = Math.round(h * (MAX / w));
          w = MAX;
        } else {
          w = Math.round(w * (MAX / h));
          h = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
      // Safety check: if still over 100KB base64, reduce quality further
      if (dataUrl.length > 100_000) {
        resolve(canvas.toDataURL("image/jpeg", 0.35));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function GalleryManager({
  category,
  password,
  slots,
  aspect,
  images,
  library,
  onUpdate,
}: GalleryManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const dragSlot = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const apiCall = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, category, action, ...extra }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        onUpdate(json.data);
        return json.data;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Eroare.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [password, category, onUpdate]
  );

  async function uploadForSlot(slotIndex: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        setLoading(true);
        const url = await resizeImage(file);
        await apiCall("setSlotImage", { slotIndex, url });
      } catch {
        setError("Eroare la procesarea imaginii.");
        setLoading(false);
      }
    };
    input.click();
  }

  function selectFromLibrary(photo: LibraryPhoto) {
    if (activeSlot === null) return;
    apiCall("setSlotImage", { slotIndex: activeSlot, url: photo.url });
    setActiveSlot(null);
    setShowLibrary(false);
  }

  async function uploadToLibrary() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        setLoading(true);
        const url = await resizeImage(file);
        await apiCall("addToLibrary", { url });
      } catch {
        setError("Eroare la procesarea imaginii.");
        setLoading(false);
      }
    };
    input.click();
  }

  // Drag & drop: swap two slots
  function handleDragStart(slotIndex: number) {
    dragSlot.current = slotIndex;
  }

  function handleDragOver(e: React.DragEvent, slotIndex: number) {
    e.preventDefault();
    setDragOver(slotIndex);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  function handleDrop(targetSlot: number) {
    setDragOver(null);
    const sourceSlot = dragSlot.current;
    dragSlot.current = null;
    if (sourceSlot === null || sourceSlot === targetSlot) return;

    // Build new order: swap source and target
    const sorted = [...images].sort((a, b) => a.order - b.order);
    const sourceImg = sorted.find((img) => img.order === sourceSlot);
    const targetImg = sorted.find((img) => img.order === targetSlot);

    if (!sourceImg && !targetImg) return;

    // Build the new ordered IDs list with swap applied
    const newImages: { id: string; order: number }[] = [];
    for (let i = 0; i < slots; i++) {
      let img;
      if (i === targetSlot) img = sourceImg;
      else if (i === sourceSlot) img = targetImg;
      else img = sorted.find((m) => m.order === i);
      if (img) newImages.push({ id: img.id, order: i });
    }

    // Use reorderImages with the swapped order
    const orderedIds = Array.from({ length: slots }, (_, i) => {
      const found = newImages.find((m) => m.order === i);
      return found?.id;
    }).filter(Boolean) as string[];

    apiCall("reorderImages", { orderedIds });
  }

  function handleDragEnd() {
    dragSlot.current = null;
    setDragOver(null);
  }

  function getGridPreview(): string {
    switch (slots) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-2";
      case 6: return "grid-cols-3";
      default: return "grid-cols-2";
    }
  }

  const aspectClass = getAspectClass(aspect);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Slot selector + Aspect selector */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Număr ferestre
        </p>
        <div className="flex gap-2 mb-4">
          {SLOT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => apiCall("setSlots", { slots: n })}
              disabled={loading}
              className={`w-10 h-10 flex items-center justify-center font-bold text-sm transition-all ${
                slots === n
                  ? "bg-[#C9AB81] text-[#0A0A0A]"
                  : "bg-white/[0.06] text-white/40 active:bg-white/[0.1]"
              } disabled:opacity-50`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Aspect imagine
        </p>
        <div className="flex gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => apiCall("setAspect", { aspect: opt.value })}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                aspect === opt.value
                  ? "bg-[#C9AB81] text-[#0A0A0A]"
                  : "bg-white/[0.06] text-white/40 active:bg-white/[0.1]"
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid - draggable clickable slots */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
          Poze galerie ({images.length}/12) — Chenare active: {slots}
        </p>
        <p className="text-white/20 text-[9px] mb-3">Trage și plasează pentru a schimba ordinea. Chenare = câte poze pe pagină</p>
        <div className={`grid ${getGridPreview()} gap-2`}>
          {Array.from({ length: Math.max(images.length + 1, slots, 1) }).slice(0, 12).map((_, i) => {
            const img = images[i];
            const isDragTarget = dragOver === i;
            return (
              <div
                key={i}
                draggable={!!img}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`relative ${aspectClass} bg-white/[0.03] border-2 overflow-hidden group transition-all ${
                  isDragTarget
                    ? "border-[#C9AB81] scale-[1.02]"
                    : "border-white/[0.08]"
                }`}
              >
                {img ? (
                  <>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {/* Drag handle */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => uploadForSlot(i)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-[#C9AB81] text-[#0A0A0A] px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        <Upload className="w-3 h-3" />
                        Înlocuiește
                      </button>
                      <button
                        onClick={() => {
                          setActiveSlot(i);
                          setShowLibrary(true);
                        }}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        <FolderOpen className="w-3 h-3" />
                        Bibliotecă
                      </button>
                      <button
                        onClick={() => apiCall("removeSlotImage", { slotIndex: i })}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-red-500/60 text-white px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        <Trash2 className="w-3 h-3" />
                        Șterge
                      </button>
                    </div>
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/60 px-1.5 py-0.5">
                      {i + 1}
                    </span>
                  </>
                ) : (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center text-white/30 cursor-pointer active:bg-white/[0.06] transition-colors gap-2 ${
                      isDragTarget ? "bg-[#C9AB81]/10" : ""
                    }`}
                    onClick={() => {
                      setActiveSlot(i);
                      setShowLibrary(true);
                    }}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Adaugă</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadForSlot(i);
                      }}
                      className="text-[8px] bg-white/10 px-2 py-1 text-white/40 font-bold tracking-wider uppercase mt-1"
                    >
                      Din PC
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Library section */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase">
            Bibliotecă poze ({library.length})
          </p>
          <button
            onClick={uploadToLibrary}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#C9AB81] text-[#0A0A0A] px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            Încarcă
          </button>
        </div>

        {library.length === 0 ? (
          <div className="py-6 text-center">
            <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/20 text-xs">Nicio poză în bibliotecă</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {library.map((photo) => (
              <div key={photo.id} className="relative aspect-square group overflow-hidden border border-white/[0.06]">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => apiCall("removeFromLibrary", { photoId: photo.id })}
                    className="w-7 h-7 bg-red-500/80 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Library picker modal */}
      {showLibrary && activeSlot !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-[#111] border-t border-white/[0.1] max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <p className="text-[#C9AB81] text-xs font-bold tracking-wider uppercase">
                Alege din bibliotecă — Fereastra {activeSlot + 1}
              </p>
              <button
                onClick={() => { setShowLibrary(false); setActiveSlot(null); }}
                className="w-8 h-8 flex items-center justify-center bg-white/10"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {library.length === 0 ? (
                <div className="py-10 text-center">
                  <ImageIcon className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm mb-3">Biblioteca e goală</p>
                  <button
                    onClick={() => {
                      uploadForSlot(activeSlot);
                      setShowLibrary(false);
                      setActiveSlot(null);
                    }}
                    className="bg-[#C9AB81] text-[#0A0A0A] px-4 py-2 text-xs font-bold tracking-wider uppercase"
                  >
                    Încarcă de pe PC
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {library.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => selectFromLibrary(photo)}
                      disabled={loading}
                      className="relative aspect-square overflow-hidden border-2 border-transparent hover:border-[#C9AB81] transition-colors disabled:opacity-50"
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  uploadForSlot(activeSlot);
                  setShowLibrary(false);
                  setActiveSlot(null);
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                Încarcă de pe PC
              </button>
              <button
                onClick={() => { setShowLibrary(false); setActiveSlot(null); }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] py-2.5 text-white/60 text-xs font-bold tracking-wider uppercase"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
