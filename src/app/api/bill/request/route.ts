import { NextRequest, NextResponse } from "next/server";
import { MOCK_BILL } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(300);

  const { umbrellaId, sessionId, phone } = await req.json();

  if (!umbrellaId || !sessionId) {
    return NextResponse.json(
      { success: false, error: "Date incomplete." },
      { status: 400 }
    );
  }

  const bill = { ...MOCK_BILL, status: "requested" as const };

  return NextResponse.json({ success: true, data: { bill } });
}
