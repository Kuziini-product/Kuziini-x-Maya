import { NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { hashPassword, createSession } from "@/lib/auth";
import type { AdminUser } from "@/types";

const KV_KEY = "admins:list";

async function getAdmins(): Promise<AdminUser[]> {
  return kvGet<AdminUser[]>(KV_KEY, []);
}

async function ensureSeedAdmins(): Promise<AdminUser[]> {
  const { generateId } = await import("@/lib/utils");
  const admins = await getAdmins();
  let modified = false;

  // Default Maya admin
  if (!admins.some((a) => a.email.toLowerCase() === "admin@maya.ro")) {
    admins.push({
      id: generateId(),
      name: "Admin Maya",
      email: "admin@maya.ro",
      phone: "+40700000000",
      role: "super_admin",
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD || "Maya2025"),
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
    modified = true;
  }

  // Default Kuziini admin
  if (!admins.some((a) => a.email.toLowerCase() === "admin@kuziini.ro")) {
    admins.push({
      id: generateId(),
      name: "Admin Kuziini",
      email: "admin@kuziini.ro",
      phone: "+40700000001",
      role: "super_admin",
      passwordHash: await hashPassword(process.env.KUZIINI_ADMIN_PASSWORD || "Kuziini1"),
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
    modified = true;
  }

  if (modified) await kvSet(KV_KEY, admins);
  return admins;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email și parola sunt obligatorii." },
        { status: 400 }
      );
    }

    const admins = await ensureSeedAdmins();
    const hash = await hashPassword(password);
    const admin = admins.find(
      (a) =>
        a.email.toLowerCase() === email.toLowerCase() &&
        a.passwordHash === hash &&
        a.active
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Email sau parolă incorectă." },
        { status: 401 }
      );
    }

    // Update last login
    admin.lastLoginAt = new Date().toISOString();
    await kvSet(KV_KEY, admins);

    // Create server-side session with HTTP-only cookie
    await createSession({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    // Return admin info (no sensitive data, no token)
    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Eroare server." },
      { status: 500 }
    );
  }
}
