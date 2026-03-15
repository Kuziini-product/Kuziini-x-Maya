import { NextRequest, NextResponse } from "next/server";
import { sleep } from "@/lib/utils";
import { BILL_REQUESTS_LOG, MOCK_UMBRELLAS, MOCK_SESSIONS } from "@/lib/mock-data";
import { sendPushToAll } from "@/lib/push";

export async function POST(req: NextRequest) {
  await sleep(500);

  const { umbrellaId, sessionId, paymentMethod, amount } = await req.json();

  if (!umbrellaId || !sessionId || !paymentMethod) {
    return NextResponse.json(
      { success: false, error: "Date incomplete." },
      { status: 400 }
    );
  }

  // Log bill request
  BILL_REQUESTS_LOG.push({
    umbrellaId,
    paymentMethod,
    amount,
    timestamp: new Date().toISOString(),
  });

  // Push notification
  sendPushToAll(
    "Plată confirmată",
    `Umbrela ${umbrellaId} · ${amount} RON · ${paymentMethod}`,
    "payment"
  ).catch(() => {});

  // Auto-close bill after 2 minutes (no POS connected)
  setTimeout(() => {
    if (MOCK_SESSIONS[sessionId]) {
      MOCK_SESSIONS[sessionId] = {
        ...MOCK_SESSIONS[sessionId],
        closed: true,
      };
    }
    if (MOCK_UMBRELLAS[umbrellaId]) {
      MOCK_UMBRELLAS[umbrellaId] = {
        ...MOCK_UMBRELLAS[umbrellaId],
        sessionId: null,
      };
    }
  }, 2 * 60 * 1000);

  return NextResponse.json({
    success: true,
    data: {
      requestId: `REQ-${Date.now()}`,
      umbrellaId,
      paymentMethod,
      amount,
      status: "paid",
      message: `Nota a fost înregistrată ca încasată. Mulțumim!`,
    },
  });
}
