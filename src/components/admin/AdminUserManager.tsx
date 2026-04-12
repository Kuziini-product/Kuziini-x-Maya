"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Shield,
  Eye,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import type { AdminRole } from "@/types";
import PhoneInput from "@/components/PhoneInput";

interface AdminSafe {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Props {
  adminId: string;
}

const ROLE_LABELS: Record<AdminRole, { label: string; icon: React.ReactNode; color: string }> = {
  super_admin: { label: "Super Admin", icon: <Shield className="w-3 h-3" />, color: "text-red-400 bg-red-400/20" },
  content_admin: { label: "Content", icon: <Eye className="w-3 h-3" />, color: "text-sky-400 bg-sky-400/20" },
  guest_admin: { label: "Oaspeti", icon: <Users className="w-3 h-3" />, color: "text-emerald-400 bg-emerald-400/20" },
};

export default function AdminUserManager({ adminId }: Props) {
  const [admins, setAdmins] = useState<AdminSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fRole, setFRole] = useState<AdminRole>("guest_admin");
  const [fPassword, setFPassword] = useState("");
  const [fActive, setFActive] = useState(true);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", adminId }),
      });
      const json = await res.json();
      if (json.success) setAdmins(json.data);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  function resetForm() {
    setFName("");
    setFEmail("");
    setFPhone("");
    setFRole("guest_admin");
    setFPassword("");
    setFActive(true);
    setEditing(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(admin: AdminSafe) {
    setFName(admin.name);
    setFEmail(admin.email);
    setFPhone(admin.phone);
    setFRole(admin.role);
    setFActive(admin.active);
    setFPassword("");
    setEditing(admin.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSave() {
    if (!fName.trim() || !fEmail.trim()) {
      setError("Numele si email-ul sunt obligatorii.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (editing) {
        // Update
        const res = await fetch("/api/admin/administrators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            adminId,
            targetId: editing,
            name: fName.trim(),
            email: fEmail.trim(),
            phone: fPhone.trim(),
            role: fRole,
            active: fActive,
            ...(fPassword ? { password: fPassword } : {}),
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      } else {
        // Create
        if (!fPassword) {
          setError("Parola este obligatorie pentru admin nou.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/administrators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            adminId,
            name: fName.trim(),
            email: fEmail.trim(),
            phone: fPhone.trim(),
            role: fRole,
            password: fPassword,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }
      resetForm();
      fetchAdmins();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full th-input border px-3 py-2 text-sm outline-none focus:border-maya-gold/50";
  const labelCls =
    "text-[10px] font-bold text-maya-gold uppercase tracking-[0.2em] mb-1 block";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">{admins.length} administratori</p>
        <button
          onClick={() => { showForm ? resetForm() : setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-maya-gold text-maya-dark text-[10px] font-bold tracking-wider uppercase"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showForm ? "Anuleaza" : "Admin nou"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="th-card border p-4 mb-4 space-y-3">
          <p className="text-maya-gold text-[10px] font-bold tracking-[0.2em] uppercase">
            {editing ? "Editeaza admin" : "Admin nou"}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nume *</label>
              <input
                type="text"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className={inputCls}
                placeholder="Nume complet"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                className={inputCls}
                placeholder="email@maya.ro"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Telefon</label>
            <PhoneInput value={fPhone} onChange={setFPhone} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Rol</label>
              <select
                value={fRole}
                onChange={(e) => setFRole(e.target.value as AdminRole)}
                className={inputCls}
              >
                <option value="super_admin">Super Admin</option>
                <option value="content_admin">Content Admin</option>
                <option value="guest_admin">Guest Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Parola {editing ? "(las gol pt. a pastra)" : "*"}
              </label>
              <input
                type="password"
                value={fPassword}
                onChange={(e) => setFPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••"
              />
            </div>
            {editing && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setFActive(!fActive)}
                  className={`w-full py-2 text-[10px] font-bold tracking-wider uppercase border ${
                    fActive
                      ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-400"
                      : "bg-red-400/20 border-red-400/30 text-red-400"
                  }`}
                >
                  {fActive ? "Cont activ" : "Cont inactiv"}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-maya-gold text-maya-dark py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Se salveaza..." : editing ? "Salveaza modificarile" : "Creeaza admin"}
          </button>
        </div>
      )}

      {/* Admin list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-5 h-5 th-text-muted animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => {
            const rl = ROLE_LABELS[a.role];
            return (
              <button
                key={a.id}
                onClick={() => startEdit(a)}
                className="w-full th-card border px-4 py-3 flex items-center justify-between text-left"
              >
                <div>
                  <p className="th-text text-sm font-medium">{a.name}</p>
                  <p className="th-text-muted text-xs">{a.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${rl.color}`}
                  >
                    {rl.icon}
                    {rl.label}
                  </span>
                  {!a.active && (
                    <span className="bg-red-400/20 text-red-400 text-[10px] font-bold px-2 py-0.5">
                      INACTIV
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
