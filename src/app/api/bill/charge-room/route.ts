import { NextRequest, NextResponse } from "next/server";
import { MOCK_CREDIT_STATUS, MOCK_UMBRELLAS, MOCK_SESSIONS } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(600);

  const { umbrellaId, sessionId, phone, amount } = await req.json();

  if (!umbrellaId || !sessionId || !phone || !amount) {
    return NextResponse.json(
      { success: false, error: "Date incomplete." },
      { status: 400 }
    );
  }

  if (!MOCK_CREDIT_STATUS.eligible) {
    return NextResponse.json(
      { success: false, error: "Room charge nu este disponibil pentru această cameră." },
      { status: 403 }
    );
  }

  if (amount > MOCK_CREDIT_STATUS.limitAvailable) {
    return NextResponse.json(
      {
        success: false,
        error: `Limita de credit depășită. Disponibil: ${MOCK_CREDIT_STATUS.limitAvailable} ${MOCK_CREDIT_STATUS.currency}`,
      },
      { status: 402 }
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
      charged: true,
      umbrellaReleased: true,
      roomNumber: MOCK_CREDIT_STATUS.roomNumber,
      amount,
      currency: MOCK_CREDIT_STATUS.currency,
      message: `Suma de ${amount} RON a fost adăugată la camera ${MOCK_CREDIT_STATUS.roomNumber}. Șezlongul ${umbrellaId} a fost eliberat.`,
    },
  });
}
