import { NextRequest, NextResponse } from "next/server";
import { MOCK_UMBRELLAS, MOCK_SESSIONS } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await sleep(200);

  const umbrella = MOCK_UMBRELLAS[params.id];

  if (!umbrella) {
    return NextResponse.json(
      { success: false, error: "Umbrela nu a fost găsită." },
      { status: 404 }
    );
  }

  const session = umbrella.sessionId
    ? MOCK_SESSIONS[umbrella.sessionId]
    : null;

  return NextResponse.json({
    success: true,
    data: { umbrella, session },
  });
}
