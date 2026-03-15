import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

const ADMIN_PASSWORD = "Kuziini1";

export interface AccessEntry {
  name: string;
  phone: string;
  email: string;
  umbrellaId: string;
  action: string; // "scan" | "menu" | "cart" | "bill" | "orders" | etc
  page: string; // full path accessed
  timestamp: string;
}

// KV keys
const ACCESS_LOG_KEY = "access:log";
const UNREAD_COUNT_KEY = "access:unread";
const ONLINE_USERS_KEY = "access:online";

async function getLog(): Promise<AccessEntry[]> {
  return kvGet<AccessEntry[]>(ACCESS_LOG_KEY, []);
}

async function saveLog(log: AccessEntry[]) {
  // Keep last 10000 entries
  await kvSet(ACCESS_LOG_KEY, log.slice(-10000));
}

async function getUnread(): Promise<number> {
  return kvGet<number>(UNREAD_COUNT_KEY, 0);
}

async function setUnread(count: number) {
  await kvSet(UNREAD_COUNT_KEY, count);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };

  // ── Public: track access ──
  if (action === "track") {
    const { name, phone, email, umbrellaId, page, accessType } = body as {
      name: string;
      phone: string;
      email: string;
      umbrellaId: string;
      page: string;
      accessType: string;
    };

    if (!phone) {
      return NextResponse.json({ success: false, error: "Missing phone." }, { status: 400 });
    }

    const entry: AccessEntry = {
      name: name || "",
      phone,
      email: email || "",
      umbrellaId: umbrellaId || "",
      action: accessType || "access",
      page: page || "/",
      timestamp: new Date().toISOString(),
    };

    const log = await getLog();
    log.push(entry);
    await saveLog(log);

    // Increment unread count
    const unread = await getUnread();
    await setUnread(unread + 1);

    return NextResponse.json({ success: true, unread: unread + 1 });
  }

  // ── Public: heartbeat (ping) ──
  if (action === "ping") {
    const { phone } = body as { phone: string };
    if (!phone) {
      return NextResponse.json({ success: true });
    }
    const online = await kvGet<Record<string, number>>(ONLINE_USERS_KEY, {});
    online[phone] = Date.now();
    // Clean up users inactive > 5 min
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [k, t] of Object.entries(online)) {
      if (t < cutoff) delete online[k];
    }
    await kvSet(ONLINE_USERS_KEY, online);
    return NextResponse.json({ success: true, online: Object.keys(online).length });
  }

  // ── Public/Admin: get online count + phones ──
  if (action === "getOnline") {
    const online = await kvGet<Record<string, number>>(ONLINE_USERS_KEY, {});
    const cutoff = Date.now() - 5 * 60 * 1000;
    const activePhones: string[] = [];
    for (const [phone, t] of Object.entries(online)) {
      if (t >= cutoff) activePhones.push(phone);
    }
    return NextResponse.json({ success: true, online: activePhones.length, phones: activePhones });
  }

  // ── Admin: get log & unread count ──
  if (action === "getLog") {
    const { password } = body as { password: string };
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Parola incorecta." }, { status: 401 });
    }

    const log = await getLog();
    const unread = await getUnread();

    // Build user profiles from log
    const users: Record<string, {
      name: string;
      phone: string;
      email: string;
      totalAccess: number;
      firstAccess: string;
      lastAccess: string;
      pages: { page: string; action: string; umbrellaId: string; timestamp: string }[];
    }> = {};

    log.forEach((e) => {
      if (!users[e.phone]) {
        users[e.phone] = {
          name: e.name,
          phone: e.phone,
          email: e.email,
          totalAccess: 0,
          firstAccess: e.timestamp,
          lastAccess: e.timestamp,
          pages: [],
        };
      }
      const u = users[e.phone];
      u.totalAccess++;
      if (e.name && e.name !== "—") u.name = e.name;
      if (e.email) u.email = e.email;
      if (e.timestamp < u.firstAccess) u.firstAccess = e.timestamp;
      if (e.timestamp > u.lastAccess) u.lastAccess = e.timestamp;
      u.pages.push({
        page: e.page,
        action: e.action,
        umbrellaId: e.umbrellaId,
        timestamp: e.timestamp,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        unread,
        totalEntries: log.length,
        users: Object.values(users).sort((a, b) => b.lastAccess.localeCompare(a.lastAccess)),
      },
    });
  }

  // ── Admin: mark as read (reset unread count) ──
  if (action === "markRead") {
    const { password } = body as { password: string };
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Parola incorecta." }, { status: 401 });
    }
    await setUnread(0);
    return NextResponse.json({ success: true });
  }

  // ── Admin: get unread count only ──
  if (action === "getUnread") {
    const unread = await getUnread();
    return NextResponse.json({ success: true, unread });
  }

  return NextResponse.json({ success: false, error: "Actiune invalida." }, { status: 400 });
}
