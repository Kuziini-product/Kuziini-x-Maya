import { NextRequest, NextResponse } from "next/server";
import { MOCK_UMBRELLAS, MOCK_SESSIONS, LOGIN_LOG } from "@/lib/mock-data";
import { sleep, generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await sleep(400);

  const { umbrellaId, phone, name } = await req.json();

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

  // Check if this phone is owner at ANY umbrella (registered at reception)
  let homeUmbrellaId: string | null = null;
  let isRegistered = false;

  for (const [uId, u] of Object.entries(MOCK_UMBRELLAS)) {
    if (u.sessionId) {
      const sess = MOCK_SESSIONS[u.sessionId];
      if (sess && !sess.closed && sess.ownerPhone === phone) {
        homeUmbrellaId = uId;
        isRegistered = true;
        break;
      }
    }
  }

  // Guest mode disabled — everyone registers as owner
  const role: "owner" = "owner";
  let sessionId = umbrella.sessionId;

  if (sessionId) {
    const existingSession = MOCK_SESSIONS[sessionId];
    if (existingSession && !existingSession.closed) {
      // Update owner phone to current user
      MOCK_SESSIONS[sessionId] = { ...existingSession, ownerPhone: phone };
    }
  } else {
    // No session on this umbrella — create one
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
  }

  if (!homeUmbrellaId) {
    homeUmbrellaId = umbrellaId;
    isRegistered = true;
  }

  // Log login
  LOGIN_LOG.push({
    name: name || "",
    phone,
    umbrellaId,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    data: {
      role,
      sessionId,
      phone,
      umbrellaId,
      homeUmbrellaId: homeUmbrellaId || null,
      isRegistered: isRegistered || role === "owner",
      joinedAt: new Date().toISOString(),
    },
  });
}
