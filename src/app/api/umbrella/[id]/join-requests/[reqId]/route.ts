import { NextResponse } from "next/server";
import {
  getUmbrellaSession,
  saveUmbrellaSession,
  isOwnerOfSession,
} from "@/lib/umbrella-session";

interface RouteContext {
  params: { id: string; reqId: string };
}

/**
 * POST /api/umbrella/[id]/join-requests/[reqId]
 * Body: { action: "approve" | "reject", callerPhone: string }
 * Only the owner can approve/reject pending join requests.
 */
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { action, callerPhone } = await req.json();
    if (!action || !callerPhone) {
      return NextResponse.json({ success: false, error: "action si callerPhone obligatorii." }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, error: "action trebuie sa fie approve sau reject." }, { status: 400 });
    }

    const session = await getUmbrellaSession(params.id);
    if (!session || session.closed) {
      return NextResponse.json({ success: false, error: "Sesiune inexistenta." }, { status: 404 });
    }
    if (!isOwnerOfSession(session, callerPhone)) {
      return NextResponse.json({ success: false, error: "Doar owner-ul poate aproba cereri." }, { status: 403 });
    }

    const reqIdx = session.pendingRequests.findIndex((r) => r.id === params.reqId);
    if (reqIdx === -1) {
      return NextResponse.json({ success: false, error: "Cerere negasita." }, { status: 404 });
    }

    const request = session.pendingRequests[reqIdx];

    if (action === "approve") {
      // Move from pending to members
      session.members.push({
        phone: request.phone,
        name: request.name,
        email: request.email,
        joinedAt: new Date().toISOString(),
      });
    }

    // Remove from pending (both approve and reject)
    session.pendingRequests.splice(reqIdx, 1);
    await saveUmbrellaSession(session);

    return NextResponse.json({
      success: true,
      data: {
        action,
        request,
        members: session.members,
        pendingRequests: session.pendingRequests,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
