import { NextRequest, NextResponse } from "next/server";
import { MOCK_UMBRELLAS, MOCK_SESSIONS } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(400);

  const { umbrellaId, sessionId, paymentMethod } = await req.json();

  if (!umbrellaId || !sessionId || !paymentMethod) {
    return NextResponse.json(
      { success: false, error: "Date incomplete." },
      { status: 400 }
    );
  }

  // Close session and release umbrella
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

  return NextResponse.json({
    success: true,
    data: {
      closed: true,
      umbrellaReleased: true,
      paymentMethod,
      closedAt: new Date().toISOString(),
      message: `Nota a fost închisă. Șezlongul ${umbrellaId} a fost eliberat.`,
    },
  });
}
