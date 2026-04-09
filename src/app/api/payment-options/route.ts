import { NextRequest, NextResponse } from "next/server";
import { MOCK_CREDIT_STATUS } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function GET(req: NextRequest) {
  await sleep(200);
  const { searchParams } = new URL(req.url);
  const umbrellaId = searchParams.get("umbrellaId");

  if (!umbrellaId) {
    return NextResponse.json({ success: false, error: "umbrellaId obligatoriu." }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      cash: true,
      card: true,
      roomCharge: MOCK_CREDIT_STATUS.eligible,
      creditStatus: MOCK_CREDIT_STATUS,
    },
  });
}

