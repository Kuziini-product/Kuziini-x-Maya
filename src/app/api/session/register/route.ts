import { NextRequest, NextResponse } from "next/server";
import { MOCK_UMBRELLAS, LOGIN_LOG } from "@/lib/mock-data";
import { sleep, generateId } from "@/lib/utils";
import { sendPushToAll } from "@/lib/push";
import {
  getUmbrellaSession,
  saveUmbrellaSession,
  isMemberOfSession,
  isOwnerOfSession,
  type UmbrellaSession,
  type UmbrellaJoinRequest,
} from "@/lib/umbrella-session";

export async function POST(req: NextRequest) {
  await sleep(200);

  const { umbrellaId, phone, name, email, joinAsGuest } = await req.json();

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

  // Get current umbrella session from KV
  let session = await getUmbrellaSession(umbrellaId);
  const now = new Date().toISOString();

  // ─── Case 1: No active session - this user becomes the owner ──────────────
  if (!session || session.closed) {
    const sessionId = `sess-${generateId()}`;
    session = {
      umbrellaId,
      sessionId,
      ownerPhone: phone,
      ownerName: name || "",
      ownerEmail: email || undefined,
      startedAt: now,
      closed: false,
      members: [{ phone, name: name || "", email, joinedAt: now }],
      pendingRequests: [],
    };
    await saveUmbrellaSession(session);

    LOGIN_LOG.push({
      name: name || "",
      phone,
      email: email || "",
      umbrellaId,
      timestamp: now,
    });

    sendPushToAll(
      "Utilizator nou",
      `${name || phone} s-a înregistrat la umbrela ${umbrellaId}`,
      "new-user"
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        role: "owner",
        sessionId,
        phone,
        umbrellaId,
        homeUmbrellaId: umbrellaId,
        isRegistered: true,
        joinedAt: now,
        ownerName: name || "",
        ownerPhone: phone,
      },
    });
  }

  // ─── Case 2: Session exists, this phone is already the owner ──────────────
  if (isOwnerOfSession(session, phone)) {
    return NextResponse.json({
      success: true,
      data: {
        role: "owner",
        sessionId: session.sessionId,
        phone,
        umbrellaId,
        homeUmbrellaId: umbrellaId,
        isRegistered: true,
        joinedAt: now,
        ownerName: session.ownerName,
        ownerPhone: session.ownerPhone,
      },
    });
  }

  // ─── Case 3: Session exists, this phone is already an approved member ─────
  if (isMemberOfSession(session, phone)) {
    return NextResponse.json({
      success: true,
      data: {
        role: "guest",
        sessionId: session.sessionId,
        phone,
        umbrellaId,
        homeUmbrellaId: umbrellaId,
        isRegistered: true,
        joinedAt: now,
        ownerName: session.ownerName,
        ownerPhone: session.ownerPhone,
      },
    });
  }

  // ─── Case 4: Session exists, new user wants to join ───────────────────────
  if (joinAsGuest) {
    // Check if this phone already has a pending request
    const existingRequest = session.pendingRequests.find((r) => r.phone === phone);
    if (!existingRequest) {
      const newRequest: UmbrellaJoinRequest = {
        id: `req-${generateId()}`,
        phone,
        name: name || "",
        email: email || undefined,
        requestedAt: now,
      };
      session.pendingRequests.push(newRequest);
      await saveUmbrellaSession(session);

      sendPushToAll(
        "Cerere alăturare",
        `${name || phone} vrea să se alăture umbrelei ${umbrellaId}`,
        "join-request"
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        role: "guest",
        sessionId: session.sessionId,
        phone,
        umbrellaId,
        homeUmbrellaId: umbrellaId,
        isRegistered: false, // pending owner approval
        pendingApproval: true,
        joinedAt: now,
        ownerName: session.ownerName,
        ownerPhone: session.ownerPhone,
      },
    });
  }

  // ─── Case 5: Session exists, no joinAsGuest flag - return session info only ─
  return NextResponse.json({
    success: true,
    data: {
      role: "unknown",
      umbrellaId,
      hasOwner: true,
      ownerName: session.ownerName,
      ownerPhone: session.ownerPhone,
      needsJoinRequest: true,
    },
  });
}
