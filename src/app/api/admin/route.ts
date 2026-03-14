import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_UMBRELLAS,
  MOCK_SESSIONS,
  LOGIN_LOG,
  ORDER_LOG,
  BILL_REQUESTS_LOG,
} from "@/lib/mock-data";

const ADMIN_PASSWORD = "Kuziini1";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: "Parolă incorectă." },
      { status: 401 }
    );
  }

  // Umbrella stats
  const umbrellas = Object.values(MOCK_UMBRELLAS).map((u) => {
    const session = u.sessionId ? MOCK_SESSIONS[u.sessionId] : null;
    return {
      id: u.id,
      zone: u.zone,
      active: u.active,
      hasSession: !!session && !session.closed,
      ownerPhone: session?.ownerPhone || null,
      sessionStarted: session?.startedAt || null,
    };
  });

  // Totals
  const totalRevenue = ORDER_LOG.reduce((s, o) => s + o.total, 0);
  const totalOrders = ORDER_LOG.length;
  const totalLogins = LOGIN_LOG.length;
  const totalBillRequests = BILL_REQUESTS_LOG.length;
  const uniquePhones = Array.from(new Set(LOGIN_LOG.map((l) => l.phone))).length;

  // Payment method breakdown
  const paymentBreakdown = BILL_REQUESTS_LOG.reduce(
    (acc, b) => {
      acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalLogins,
        uniquePhones,
        totalOrders,
        totalRevenue,
        totalBillRequests,
        paymentBreakdown,
      },
      umbrellas,
      logins: [...LOGIN_LOG].reverse(),
      orders: [...ORDER_LOG].reverse(),
      billRequests: [...BILL_REQUESTS_LOG].reverse(),
    },
  });
}
