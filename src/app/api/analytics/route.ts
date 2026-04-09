import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/kv";
import { sendPushToAll } from "@/lib/push";

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
  email: string;
  source: ("receptie" | "oferta")[];
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
  offerDetails: { message: string; photoUrl: string; timestamp: string }[];
  umbrellas: string[];
}

// ── KV helpers ─────────────────────────────────────────

async function getPhotoStats(): Promise<Record<string, PhotoStats>> {
  return kvGet<Record<string, PhotoStats>>("analytics:photos", {});
}

async function savePhotoStats(stats: Record<string, PhotoStats>) {
  await kvSet("analytics:photos", stats);
}

interface ViewLogEntry {
  sessionId: string;
  photoIndex: number;
  timestamp: string;
  duration?: number; // seconds spent viewing
}

async function getViewLog(): Promise<ViewLogEntry[]> {
  return kvGet("analytics:view_log", []);
}

async function saveViewLog(log: ViewLogEntry[]) {
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
    // Push notification on new like
    if (idx === -1) {
      sendPushToAll(
        "Like nou",
        `Cineva a dat inimioara la poza #${photoIndex + 1}`,
        "heart"
      ).catch(() => {});
    }
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

  if (action === "trackViewDuration") {
    const { photoIndex, sessionId, duration } = body as { photoIndex: number; sessionId: string; duration: number };
    if (photoIndex === undefined || !sessionId || !duration) {
      return NextResponse.json({ success: false, error: "Missing data." }, { status: 400 });
    }
    // Find and update the matching view log entry (most recent one for this session+photo)
    const log = await getViewLog();
    // Find last entry for this session+photo that doesn't have duration yet
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].sessionId === sessionId && log[i].photoIndex === photoIndex && !log[i].duration) {
        log[i].duration = Math.min(duration, 600); // cap at 10 min
        break;
      }
    }
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
      offers: { name: string; phone: string; email: string; message: string; photoUrl: string; timestamp: string }[];
    };

    const makeClient = (phone: string, timestamp: string): ClientProfile => ({
      phone, name: "—", email: "", source: [],
      totalVisits: 0, firstVisit: timestamp, lastVisit: timestamp,
      totalSpent: 0, totalOrders: 0, avgPerVisit: 0,
      paymentMethods: {}, kuziiniPhotosViewed: 0, kuziiniPhotoLikes: 0,
      offerRequests: 0, offerDetails: [], umbrellas: [],
    });

    const photoStats = await getPhotoStats();
    const viewLog = await getViewLog();

    // Build client profiles from login data
    const clients: Record<string, ClientProfile> = {};

    // Process logins
    (logins || []).forEach((l) => {
      if (!l.phone) return;
      if (!clients[l.phone]) clients[l.phone] = makeClient(l.phone, l.timestamp);
      const c = clients[l.phone];
      c.totalVisits++;
      if (l.name && l.name !== "—") c.name = l.name;
      if (!c.source.includes("receptie")) c.source.push("receptie");
      if (l.timestamp < c.firstVisit) c.firstVisit = l.timestamp;
      if (l.timestamp > c.lastVisit) c.lastVisit = l.timestamp;
      if (l.umbrellaId && !c.umbrellas.includes(l.umbrellaId)) {
        c.umbrellas.push(l.umbrellaId);
      }
    });

    // Process orders
    (orders || []).forEach((o) => {
      if (!o.phone) return;
      if (!clients[o.phone]) clients[o.phone] = makeClient(o.phone, o.timestamp);
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

    // Process offers — also create client profiles for offer submitters
    (offers || []).forEach((o) => {
      if (!o.phone) return;
      if (!clients[o.phone]) clients[o.phone] = makeClient(o.phone, o.timestamp);
      const c = clients[o.phone];
      c.offerRequests++;
      if (o.name && o.name !== "—") c.name = o.name;
      if (o.email) c.email = o.email;
      if (!c.source.includes("oferta")) c.source.push("oferta");
      if (o.timestamp < c.firstVisit) c.firstVisit = o.timestamp;
      if (o.timestamp > c.lastVisit) c.lastVisit = o.timestamp;
      c.offerDetails.push({
        message: o.message || "",
        photoUrl: o.photoUrl || "",
        timestamp: o.timestamp,
      });
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

  if (action === "getGalleryStats") {
    const viewLog = await getViewLog();
    const photoStats = await getPhotoStats();

    // Build per-user gallery stats
    const userMap: Record<string, {
      sessionId: string;
      photosViewed: number;
      totalTimeSpent: number; // seconds
      photoDetails: { photoIndex: number; timestamp: string; duration: number }[];
      likes: number;
      firstView: string;
      lastView: string;
    }> = {};

    viewLog.forEach((entry) => {
      if (!userMap[entry.sessionId]) {
        userMap[entry.sessionId] = {
          sessionId: entry.sessionId,
          photosViewed: 0,
          totalTimeSpent: 0,
          photoDetails: [],
          likes: 0,
          firstView: entry.timestamp,
          lastView: entry.timestamp,
        };
      }
      const u = userMap[entry.sessionId];
      u.photosViewed++;
      u.totalTimeSpent += entry.duration || 0;
      u.photoDetails.push({
        photoIndex: entry.photoIndex,
        timestamp: entry.timestamp,
        duration: entry.duration || 0,
      });
      if (entry.timestamp < u.firstView) u.firstView = entry.timestamp;
      if (entry.timestamp > u.lastView) u.lastView = entry.timestamp;
    });

    // Count likes per user
    for (const [, val] of Object.entries(photoStats)) {
      val.likedBy.forEach((sid) => {
        if (userMap[sid]) userMap[sid].likes++;
      });
    }

    // Photo summary with avg duration
    const photoSummary: { index: number; likes: number; views: number; avgDuration: number; totalDuration: number }[] = [];
    for (const [key, val] of Object.entries(photoStats)) {
      const idx = parseInt(key.replace("kuziini-", ""));
      const viewsForPhoto = viewLog.filter((v) => v.photoIndex === idx);
      const durations = viewsForPhoto.filter((v) => v.duration).map((v) => v.duration!);
      const totalDur = durations.reduce((s, d) => s + d, 0);
      const avgDur = durations.length > 0 ? Math.round(totalDur / durations.length) : 0;
      photoSummary.push({ index: idx, likes: val.likes, views: val.views, avgDuration: avgDur, totalDuration: totalDur });
    }

    // Hourly distribution
    const hourlyViews: number[] = new Array(24).fill(0);
    viewLog.forEach((v) => {
      const hour = new Date(v.timestamp).getHours();
      hourlyViews[hour]++;
    });

    return NextResponse.json({
      success: true,
      data: {
        users: Object.values(userMap).sort((a, b) => b.totalTimeSpent - a.totalTimeSpent),
        photos: photoSummary.sort((a, b) => b.views - a.views),
        hourlyViews,
        totalViews: viewLog.length,
        uniqueViewers: Object.keys(userMap).length,
        totalTimeSpent: Object.values(userMap).reduce((s, u) => s + u.totalTimeSpent, 0),
      },
    });
  }

  return NextResponse.json({ success: false, error: "Actiune invalida." }, { status: 400 });
}

