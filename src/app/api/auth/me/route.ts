import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    const { authenticated, session } = await validateSession();
    if (!authenticated || !session) {
      return NextResponse.json(
        { success: false, error: "Neautorizat." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.adminId,
        name: session.name,
        email: session.email,
        role: session.role,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Eroare server." },
      { status: 500 }
    );
  }
}
