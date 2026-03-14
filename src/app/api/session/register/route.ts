import { NextRequest, NextResponse } from "next/server";
import { MOCK_UMBRELLAS, MOCK_SESSIONS } from "@/lib/mock-data";
import { sleep, generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(400);

  const { umbrellaId, phone } = await req.json();

  if (!umbrellaId || !phone) {
    return NextResponse.json({ success: false, error: "umbrellaId și phone sunt obligatorii." }, { status: 400 });
  }

  const umbrella = MOCK_UMBRELLAS[umbrellaId];
  if (!umbrella) {
    return NextResponse.json({ success: false, error: "Umbrela nu a fost găsită." }, { status: 404 });
  }

  if (!umbrella.active) {
    return NextResponse.json({ success: false, error: "Umbrela nu este activă." }, { status: 403 });
  }

  // Determine role
  let role: "owner" | "guest" = "owner";
  let sessionId = umbrella.sessionId;

  if (sessionId) {
    const existingSession = MOCK_SESSIONS[sessionId];
    if (existingSession && !existingSession.closed) {
      if (existingSession.ownerPhone === phone) {
        role = "owner";
      } else {
        role = "guest";
      }
    }
  } else {
    // Create new session
    sessionId = `sess-${generateId()}`;
    MOCK_SESSIONS[sessionId] = {
      id: sessionId,
      umbrellaId,
      ownerId: `user-${generateId()}`,
      ownerPhone: phone,
      startedAt: new Date().toISOString(),
      expiresAt: null,
      closed: false,
    };
    MOCK_UMBRELLAS[umbrellaId] = { ...umbrella, sessionId };
    role = "owner";
  }

  return NextResponse.json({
    success: true,
    data: {
      role,
      sessionId,
      phone,
      umbrellaId,
      joinedAt: new Date().toISOString(),
    },
  });
}
