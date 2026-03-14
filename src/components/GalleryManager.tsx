"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import type { BannerCategory } from "@/types";
import type { GalleryImage } from "@/lib/mock-data";

interface GalleryManagerProps {
  category: BannerCategory;
  password: string;
  slots: number;
  images: GalleryImage[];
  onUpdate: (data: { slots: number; images: GalleryImage[] }) => void;
}

const SLOT_OPTIONS = [1, 2, 3, 4, 6];

export default function GalleryManager({
  category,
  password,
  slots,
  images,
  onUpdate,
}: GalleryManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleImageUpload() {
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
        apiCall("addImage", { url: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function handleUrlAdd() {
    const url = prompt("Introdu URL-ul imaginii:");
    if (url?.trim()) {
      apiCall("addImage", { url: url.trim() });
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const ids = images.map((img) => img.id);
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[index], ids[swapIdx]] = [ids[swapIdx], ids[index]];
    await apiCall("reorderImages", { orderedIds: ids });
  }

  // Grid layout classes based on slots
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

      {/* Preview grid */}
      <div className="bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
          Previzualizare ({images.length}/{slots} imagini)
        </p>
        <div className={`grid ${getGridPreview()} gap-2`}>
          {Array.from({ length: slots }).map((_, i) => {
            const img = images[i];
            return (
              <div
                key={i}
                className="relative aspect-square bg-white/[0.03] border border-white/[0.08] overflow-hidden"
              >
                {img ? (
                  <>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {i > 0 && (
                        <button
                          onClick={() => handleMove(i, "up")}
                          className="w-7 h-7 bg-black/60 flex items-center justify-center"
                        >
                          <ChevronUp className="w-4 h-4 text-white" />
                        </button>
                      )}
                      {i < images.length - 1 && (
                        <button
                          onClick={() => handleMove(i, "down")}
                          className="w-7 h-7 bg-black/60 flex items-center justify-center"
                        >
                          <ChevronDown className="w-4 h-4 text-white" />
                        </button>
                      )}
                      <button
                        onClick={() => apiCall("removeImage", { imageId: img.id })}
                        className="w-7 h-7 bg-red-500/60 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/60 px-1.5 py-0.5">
                      {i + 1}
                    </span>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[9px]">Gol</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add buttons */}
      {images.length < slots && (
        <div className="flex gap-2">
          <button
            onClick={handleImageUpload}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Încarcă poză
          </button>
          <button
            onClick={handleUrlAdd}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] py-2.5 text-white/60 text-xs font-bold tracking-wider uppercase disabled:opacity-50 active:bg-white/[0.1]"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            URL imagine
          </button>
        </div>
      )}

      {/* Image list */}
      <div className="space-y-2">
        {images.map((img, i) => (
          <div key={img.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] p-2">
            <img src={img.url} alt="" className="w-12 h-12 object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] truncate">{img.url.startsWith("data:") ? "Imagine încărcată" : img.url}</p>
              <p className="text-white/30 text-[9px]">Poziția {i + 1}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleMove(i, "up")}
                disabled={i === 0 || loading}
                className="w-6 h-6 flex items-center justify-center bg-white/10 disabled:opacity-20"
              >
                <ChevronUp className="w-3 h-3 text-white/60" />
              </button>
              <button
                onClick={() => handleMove(i, "down")}
                disabled={i === images.length - 1 || loading}
                className="w-6 h-6 flex items-center justify-center bg-white/10 disabled:opacity-20"
              >
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              <button
                onClick={() => apiCall("removeImage", { imageId: img.id })}
                disabled={loading}
                className="w-6 h-6 flex items-center justify-center bg-red-500/10 text-red-400 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
