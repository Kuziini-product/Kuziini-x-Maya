"use client";

export function ScratchX({ className = "h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Scratchy X - two rough diagonal lines */}
      <path
        d="M2 18 C8 15, 15 12, 22 9 C26 7, 30 5, 35 4 C40 3, 48 1, 58 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "url(#rough)" }}
      />
      <path
        d="M3 17 C10 14, 16 11, 23 8 C28 6, 33 4, 38 3 C44 2, 50 1, 57 1"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M2 2 C8 4, 14 7, 20 9 C26 11, 32 13, 38 15 C44 16, 50 18, 58 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 1 C10 4, 17 7, 23 9 C28 11, 34 13, 40 15 C46 17, 52 18, 57 19"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Small scratchy accents */}
      <path d="M1 17 C2 18, 3 19, 4 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M56 1 C57 0, 58 0, 59 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M1 3 C2 2, 3 1, 4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M56 19 C57 20, 58 20, 59 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
