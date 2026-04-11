import { cookies } from "next/headers";
import { kvGet, kvSet } from "@/lib/kv";
import type { AdminRole } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "maya_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const KV_PREFIX = "session:";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ServerSession {
  id: string;
  adminId: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: number;
  expiresAt: number;
}

export interface AuthResult {
  authenticated: boolean;
  session: ServerSession | null;
  error?: string;
}

// ─── Token generation ──────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Password hashing ──────────────────────────────────────────────────────────

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Session CRUD ──────────────────────────────────────────────────────────────

async function getSession(token: string): Promise<ServerSession | null> {
  return kvGet<ServerSession | null>(`${KV_PREFIX}${token}`, null);
}

async function saveSession(token: string, session: ServerSession): Promise<void> {
  await kvSet(`${KV_PREFIX}${token}`, session);
}

async function deleteSession(token: string): Promise<void> {
  await kvSet(`${KV_PREFIX}${token}`, null);
}

// ─── Create session (called on login) ──────────────────────────────────────────

export async function createSession(admin: {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}): Promise<string> {
  const token = generateToken();
  const now = Date.now();

  const session: ServerSession = {
    id: token,
    adminId: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  await saveSession(token, session);

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return token;
}

// ─── Destroy session (called on logout) ────────────────────────────────────────

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ─── Validate session (used in API routes and middleware) ───────────────────────

export async function validateSession(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return { authenticated: false, session: null, error: "No session" };
    }

    const session = await getSession(token);
    if (!session) {
      return { authenticated: false, session: null, error: "Invalid session" };
    }

    if (Date.now() > session.expiresAt) {
      await deleteSession(token);
      return { authenticated: false, session: null, error: "Session expired" };
    }

    return { authenticated: true, session };
  } catch {
    return { authenticated: false, session: null, error: "Session error" };
  }
}

// ─── Require auth helper (throws-style for API routes) ─────────────────────────

export async function requireAuth(roles?: AdminRole[]): Promise<ServerSession> {
  const { authenticated, session, error } = await validateSession();
  if (!authenticated || !session) {
    throw new AuthError(error || "Neautorizat.", 401);
  }
  if (roles && !roles.includes(session.role)) {
    throw new AuthError("Acces interzis.", 403);
  }
  return session;
}

// ─── Auth error class ──────────────────────────────────────────────────────────

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

// ─── Get session token from cookie (for middleware - no async cookies()) ───────

export function getSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
  return match ? match[1] : null;
}

// ─── Content admin password validation (server-side only) ──────────────────────

export function getContentPassword(category: "Maya" | "kuziini"): string {
  if (category === "Maya") {
    return process.env.MAYA_ADMIN_PASSWORD || "Maya2025";
  }
  return process.env.KUZIINI_ADMIN_PASSWORD || "Kuziini1";
}
