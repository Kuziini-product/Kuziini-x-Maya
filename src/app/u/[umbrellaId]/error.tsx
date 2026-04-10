"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-retry on React #300 (non-fatal setState during render)
    const timer = setTimeout(() => reset(), 100);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return null;
}
