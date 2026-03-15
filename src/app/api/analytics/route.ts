import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";

const ADMIN_PASSWORD = "Kuziini1";

// ── Types ──────────────────────────────────────────────

export interface PhotoStats {
  likes: number;
  views: number;
  likedBy: string[]; // sessionIds
}

export interface ClientProfile {
  phone: string;
  name: string;
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  totalSpent: number;
  totalOrders: number;
  avgPerVisit: number;
  paymentMethods: Record<string, number>;
  kuziiniPhotosViewed: number;
  kuziiniPhotoLikes: number;
  offerRequests: number;
  umbrellas: string[];
}

// ── KV helpers ─────────────────────────────────────────

async function getPhotoStats(): Promise<Record<string, PhotoStats>> {
  return kvGet<Record<string, PhotoStats>>("analytics:photos", {});
}

async function savePhotoStats(stats: Record<string, PhotoStats>) {
  await kvSet("analytics:photos", stats);
}

async function getViewLog(): Promise<{ sessionId: string; photoIndex: number; timestamp: string }[]> {
  return kvGet("analytics:view_log", []);
}

async function saveViewLog(log: { sessionId: string; photoIndex: number; timestamp: string }[]) {
  // Keep last 5000 entries
  const trimmed = log.slice(-5000);
  await kvSet("analytics:view_log", trimmed);
}

// ── POST handler ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };

  // ── Public actions ──

  if (action === "toggleLike") {
    const { photoIndex, sessionId } = body as { photoIndex: number; sessionId: string };
    if (photoIndex === undefined || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing data." }, { status: 400 });
    }
    const stats = await getPhotoStats();
    const key = `kuziini-${photoIndex}`;
    if (!stats[key]) {
      stats[key] = { likes: 0, views: 0, likedBy: [] };
    }
    const idx = stats[key].likedBy.indexOf(sessionId);
    if (idx === -1) {
      stats[key].likedBy.push(sessionId);
      stats[key].likes++;
    } else {
      stats[key].likedBy.splice(idx, 1);
      stats[key].likes--;
    }
    await savePhotoStats(stats);
    return NextResponse.json({ success: true, liked: idx === -1, likes: stats[key].likes });
  }

  if (action === "trackView") {
    const { photoIndex, sessionId } = body as { photoIndex: number; sessionId: string };
    if (photoIndex === undefined || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing data." }, { status: 400 });
    }
    const stats = await getPhotoStats();
    const key = `kuziini-${photoIndex}`;
    if (!stats[key]) {
      stats[key] = { likes: 0, views: 0, likedBy: [] };
    }
    stats[key].views++;
    await savePhotoStats(stats);

    // Also log the view
    const log = await getViewLog();
    log.push({ sessionId, photoIndex, timestamp: new Date().toISOString() });
    await saveViewLog(log);

    return NextResponse.json({ success: true });
  }

  if (action === "getPhotoStats") {
    const { sessionId } = body as { sessionId: string };
    const stats = await getPhotoStats();
    // Return likes counts and which ones this session liked
    const result: Record<string, { likes: number; liked: boolean }> = {};
    for (const [key, val] of Object.entries(stats)) {
      result[key] = {
        likes: val.likes,
        liked: sessionId ? val.likedBy.includes(sessionId) : false,
      };
    }
    return NextResponse.json({ success: true, data: result });
  }

  // ── Admin actions ──

  const { password } = body as { password: string };
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Parola incorecta." }, { status: 401 });
  }

  if (action === "getClientProfiles") {
    // Aggregate client data from logins, orders, bills, offers, analytics
    const { logins, orders, billRequests, offers } = body as {
      logins: { name: string; phone: string; umbrellaId: string; timestamp: string }[];
      orders: { phone: string; total: number; timestamp: string }[];
      billRequests: { umbrellaId: string; paymentMethod: string; amount: number }[];
      offers: { phone: string; timestamp: string }[];
    };

    const photoStats = await getPhotoStats();
    const viewLog = await getViewLog();

    // Build client profiles from login data
    const clients: Record<string, ClientProfile> = {};

    // Process logins
    (logins || []).forEach((l) => {
      if (!l.phone) return;
      if (!clients[l.phone]) {
        clients[l.phone] = {
          phone: l.phone,
          name: l.name || "—",
          totalVisits: 0,
          firstVisit: l.timestamp,
          lastVisit: l.timestamp,
          totalSpent: 0,
          totalOrders: 0,
          avgPerVisit: 0,
          paymentMethods: {},
          kuziiniPhotosViewed: 0,
          kuziiniPhotoLikes: 0,
          offerRequests: 0,
          umbrellas: [],
        };
      }
      const c = clients[l.phone];
      c.totalVisits++;
      if (l.name && l.name !== "—") c.name = l.name;
      if (l.timestamp < c.firstVisit) c.firstVisit = l.timestamp;
      if (l.timestamp > c.lastVisit) c.lastVisit = l.timestamp;
      if (l.umbrellaId && !c.umbrellas.includes(l.umbrellaId)) {
        c.umbrellas.push(l.umbrellaId);
      }
    });

    // Process orders
    (orders || []).forEach((o) => {
      if (!o.phone) return;
      if (!clients[o.phone]) {
        clients[o.phone] = {
          phone: o.phone,
          name: "—",
          totalVisits: 0,
          firstVisit: o.timestamp,
          lastVisit: o.timestamp,
          totalSpent: 0,
          totalOrders: 0,
          avgPerVisit: 0,
          paymentMethods: {},
          kuziiniPhotosViewed: 0,
          kuziiniPhotoLikes: 0,
          offerRequests: 0,
          umbrellas: [],
        };
      }
      clients[o.phone].totalOrders++;
      clients[o.phone].totalSpent += o.total;
    });

    // Process bill requests (match by umbrella → find who was at that umbrella)
    (billRequests || []).forEach((b) => {
      // Find client at this umbrella
      const login = (logins || []).find((l) => l.umbrellaId === b.umbrellaId);
      if (login && clients[login.phone]) {
        const method = b.paymentMethod || "unknown";
        clients[login.phone].paymentMethods[method] =
          (clients[login.phone].paymentMethods[method] || 0) + 1;
      }
    });

    // Process offers
    (offers || []).forEach((o) => {
      if (!o.phone) return;
      if (clients[o.phone]) {
        clients[o.phone].offerRequests++;
      }
    });

    // Calculate averages
    Object.values(clients).forEach((c) => {
      c.avgPerVisit = c.totalVisits > 0 ? Math.round(c.totalSpent / c.totalVisits) : 0;
    });

    // Photo stats summary
    const photoSummary: { index: number; likes: number; views: number }[] = [];
    for (const [key, val] of Object.entries(photoStats)) {
      const idx = parseInt(key.replace("kuziini-", ""));
      photoSummary.push({ index: idx, likes: val.likes, views: val.views });
    }

    // View log summary
    const totalPhotoViews = viewLog.length;
    const uniqueViewers = new Set(viewLog.map((v) => v.sessionId)).size;

    return NextResponse.json({
      success: true,
      data: {
        clients: Object.values(clients).sort((a, b) => b.totalSpent - a.totalSpent),
        photoStats: photoSummary.sort((a, b) => b.likes - a.likes),
        totalPhotoViews,
        uniqueViewers,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Actiune invalida." }, { status: 400 });
}
