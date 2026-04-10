import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { generateId } from "@/lib/utils";
import type { AdminUser, AdminRole } from "@/types";

const KV_KEY = "admins:list";

async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getAdmins(): Promise<AdminUser[]> {
  return kvGet<AdminUser[]>(KV_KEY, []);
}

async function saveAdmins(list: AdminUser[]) {
  return kvSet(KV_KEY, list);
}

async function seedIfEmpty(): Promise<AdminUser[]> {
  let admins = await getAdmins();
  if (admins.length === 0) {
    const seed: AdminUser = {
      id: generateId(),
      name: "Admin",
      email: "admin@maya.ro",
      phone: "+40700000000",
      role: "super_admin",
      passwordHash: await hashPassword("Maya2025"),
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    admins = [seed];
    await saveAdmins(admins);
  }
  return admins;
}

function sanitize(admin: AdminUser) {
  const { passwordHash: _, ...rest } = admin;
  return rest;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── LOGIN ──
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email și parola sunt obligatorii." });
      }
      const admins = await seedIfEmpty();
      const hash = await hashPassword(password);
      const admin = admins.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.passwordHash === hash && a.active
      );
      if (!admin) {
        return NextResponse.json({ success: false, error: "Email sau parolă incorectă." });
      }
      admin.lastLoginAt = new Date().toISOString();
      await saveAdmins(admins);
      return NextResponse.json({ success: true, data: sanitize(admin) });
    }

    // ── All other actions require adminId for auth ──
    const { adminId } = body;
    const admins = await seedIfEmpty();
    const caller = admins.find((a) => a.id === adminId && a.active);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Neautorizat." });
    }

    // ── LIST ──
    if (action === "list") {
      return NextResponse.json({ success: true, data: admins.map(sanitize) });
    }

    // Only super_admin can create/update/delete
    if (caller.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Doar super_admin poate gestiona administratorii." });
    }

    // ── CREATE ──
    if (action === "create") {
      const { name, email, phone, role, password } = body;
      if (!name || !email || !password) {
        return NextResponse.json({ success: false, error: "Nume, email și parolă sunt obligatorii." });
      }
      if (admins.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        return NextResponse.json({ success: false, error: "Există deja un admin cu acest email." });
      }
      const newAdmin: AdminUser = {
        id: generateId(),
        name,
        email,
        phone: phone || "",
        role: (role as AdminRole) || "guest_admin",
        passwordHash: await hashPassword(password),
        active: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      admins.push(newAdmin);
      await saveAdmins(admins);
      return NextResponse.json({ success: true, data: sanitize(newAdmin) });
    }

    // ── UPDATE ──
    if (action === "update") {
      const { targetId, name, email, phone, role, password, active } = body;
      const idx = admins.findIndex((a) => a.id === targetId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Admin negăsit." });
      }
      if (name !== undefined) admins[idx].name = name;
      if (email !== undefined) admins[idx].email = email;
      if (phone !== undefined) admins[idx].phone = phone;
      if (role !== undefined) admins[idx].role = role as AdminRole;
      if (active !== undefined) admins[idx].active = active;
      if (password) admins[idx].passwordHash = await hashPassword(password);
      await saveAdmins(admins);
      return NextResponse.json({ success: true, data: sanitize(admins[idx]) });
    }

    // ── DELETE ──
    if (action === "delete") {
      const { targetId } = body;
      const idx = admins.findIndex((a) => a.id === targetId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Admin negăsit." });
      }
      admins[idx].active = false;
      await saveAdmins(admins);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acțiune necunoscută." });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Eroare server." });
  }
}
