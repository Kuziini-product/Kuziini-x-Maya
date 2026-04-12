import { NextResponse } from "next/server";
import { getUmbrellaSession } from "@/lib/umbrella-session";

/**
 * GET /api/umbrella/[id]/session
 * Returns the current session info for an umbrella - who owns it, members, pending requests.
 * Public endpoint - no auth needed (used by clients to detect if umbrella has owner).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUmbrellaSession(params.id);
    if (!session || session.closed) {
      return NextResponse.json({
        success: true,
        data: {
          hasOwner: false,
          umbrellaId: params.id,
        },
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        hasOwner: true,
        umbrellaId: params.id,
        sessionId: session.sessionId,
        ownerPhone: session.ownerPhone,
        ownerName: session.ownerName,
        members: session.members,
        pendingRequests: session.pendingRequests,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Eroare server." }, { status: 500 });
  }
}
