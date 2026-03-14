"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ImageIcon, X, Upload, FolderOpen } from "lucide-react";
import type { BannerCategory } from "@/types";
import type { GalleryImage, LibraryPhoto } from "@/lib/mock-data";

interface GalleryManagerProps {
  category: BannerCategory;
  password: string;
  slots: number;
  images: GalleryImage[];
  library: LibraryPhoto[];
  onUpdate: (data: { slots: number; images: GalleryImage[]; library: LibraryPhoto[] }) => void;
}

const SLOT_OPTIONS = [1, 2, 3, 4, 6];

export default function GalleryManager({
  category,
  password,
  slots,
  images,
  library,
  onUpdate,
}: GalleryManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

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

  function uploadForSlot(slotIndex: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 800 * 1024) {
        setError("Imaginea trebuie să fie sub 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        apiCall("setSlotImage", { slotIndex, url: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function selectFromLibrary(photo: LibraryPhoto) {
    if (activeSlot === null) return;
    apiCall("setSlotImage", { slotIndex: activeSlot, url: photo.url });
    setActiveSlot(null);
    setShowLibrary(false);
  }

  function uploadToLibrary() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 800 * 1024) {
        setError("Imaginea trebuie să fie sub 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        apiCall("addToLibrary", { url: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Slot selector */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Număr ferestre
        </p>
        <div className="flex gap-2">
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
      </div>

      {/* Grid - clickable slots */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Ferestre ({images.length}/{slots})
        </p>
        <div className={`grid ${getGridPreview()} gap-2`}>
          {Array.from({ length: slots }).map((_, i) => {
            const img = images[i];
            return (
              <div
                key={i}
                className="relative aspect-square bg-white/[0.03] border border-white/[0.08] overflow-hidden group"
              >
                {img ? (
                  <>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
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
                    className="w-full h-full flex flex-col items-center justify-center text-white/30 cursor-pointer active:bg-white/[0.06] transition-colors gap-2"
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
