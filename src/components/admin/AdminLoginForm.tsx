"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import type { AdminTheme } from "@/lib/admin-theme";
import type { AdminRole } from "@/types";

interface Props {
  theme: AdminTheme;
  onLogin: (session: { id: string; name: string; email: string; role: AdminRole }) => void;
}

export default function AdminLoginForm({ theme, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Introdu email-ul si parola.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onLogin(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6" data-theme={theme}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/Maya.png"
            alt="Maya"
            className="h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold th-text tracking-wide">
            Manager Maya
          </h1>
          <p className="th-text-muted text-xs mt-1">Administrare completa</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
              Email
            </label>
            <div className="flex items-center gap-3 th-input border th-border px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
              <Mail className="w-4 h-4 th-text-muted shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("pw-input")?.focus()}
                className="flex-1 bg-transparent outline-none th-text text-sm placeholder:th-text-faint"
                placeholder="admin@maya.ro"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
              Parola
            </label>
            <div className="flex items-center gap-3 th-input border th-border px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
              <Lock className="w-4 h-4 th-text-muted shrink-0" />
              <input
                id="pw-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="flex-1 bg-transparent outline-none th-text text-sm placeholder:th-text-faint"
                placeholder="Introdu parola"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Se verifica..." : "Autentificare"}
          </button>

          <p className="th-text-faint text-[10px] text-center">
            Contacteaza administratorul pentru credentiale.
          </p>
        </div>
      </div>
    </div>
  );
}
