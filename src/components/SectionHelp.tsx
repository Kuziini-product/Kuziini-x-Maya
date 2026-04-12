"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface SectionHelpProps {
  items: string[];
}

export default function SectionHelp({ items }: SectionHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-white/30 active:bg-white/[0.08] transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Instrucțiuni
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-5">
          <div className="w-full max-w-md bg-[#111] border border-white/[0.1] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <p className="text-maya-gold text-xs font-bold tracking-wider uppercase">
                Instrucțiuni
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-white/10"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/60 leading-relaxed">
                    <span className="text-maya-gold font-bold shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-white/[0.06]">
              <button
                onClick={() => setOpen(false)}
                className="w-full bg-maya-gold text-maya-dark py-2.5 font-bold text-xs tracking-wider uppercase"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

