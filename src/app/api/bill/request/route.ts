import { NextRequest, NextResponse } from "next/server";
import { sleep } from "@/lib/utils";
import { BILL_REQUESTS_LOG } from "@/lib/mock-data";

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

  // Notify POS — waiter will come with the bill
  return NextResponse.json({
    success: true,
    data: {
      requestId: `REQ-${Date.now()}`,
      umbrellaId,
      paymentMethod,
      amount,
      status: "pending",
      message: `Nota a fost trimisă la POS. Ospătarul vine la umbrela ${umbrellaId}.`,
    },
  });
}
