import { NextRequest, NextResponse } from "next/server";
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

  return NextResponse.json({
    success: true,
    data: {
      closed: true,
      paymentMethod,
      closedAt: new Date().toISOString(),
      message: `Nota a fost închisă cu succes. Metoda de plată: ${paymentMethod}`,
    },
  });
}
