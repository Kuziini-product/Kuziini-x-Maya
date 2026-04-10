"use client";

export function ScratchX({ className = "h-4" }: { className?: string }) {
  return (
    <img
      src="/x-design.png"
      alt="×"
      className={`object-contain invert brightness-200 ${className}`}
    />
  );
}
