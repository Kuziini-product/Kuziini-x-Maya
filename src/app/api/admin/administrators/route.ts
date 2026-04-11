import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { generateId } from "@/lib/utils";
import { hashPassword, requireAuth, AuthError } from "@/lib/auth";
import type { AdminUser, AdminRole } from "@/types";

const KV_KEY = "admins:list";

async function getAdmins(): Promise<AdminUser[]> {
  return kvGet<AdminUser[]>(KV_KEY, []);
}

async function saveAdmins(list: AdminUser[]) {
  return kvSet(KV_KEY, list);
}

function sanitize(admin: AdminUser) {
  const { passwordHash: _, ...rest } = admin;
  return rest;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── All actions require authenticated session ──
    let session;
    try {
      session = await requireAuth();
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
    }

    const admins = await getAdmins();
    const caller = admins.find((a) => a.id === session.adminId && a.active);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Neautorizat." }, { status: 401 });
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
