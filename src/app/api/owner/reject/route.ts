import { NextRequest, NextResponse } from "next/server";
import { sleep } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(300);

  const { requestId, orderId, umbrellaId, reason } = await req.json();

  if (!requestId || !orderId || !umbrellaId) {
    return NextResponse.json(
      { success: false, error: "Date incomplete." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      requestId,
      orderId,
      approved: false,
      reason: reason ?? "Respins de owner.",
    },
  });
}

