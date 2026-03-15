import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscription, getSubscriptions, VAPID_PUBLIC_KEY } from "@/lib/push";

export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };

  if (action === "subscribe") {
    const { subscription } = body as { subscription: { endpoint: string; keys: { p256dh: string; auth: string } } };
    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ success: false, error: "Invalid subscription." }, { status: 400 });
    }
    await saveSubscription({ endpoint: subscription.endpoint, keys: subscription.keys });
    return NextResponse.json({ success: true });
  }

  if (action === "unsubscribe") {
    const { endpoint } = body as { endpoint: string };
    if (!endpoint) {
      return NextResponse.json({ success: false, error: "Missing endpoint." }, { status: 400 });
    }
    await removeSubscription(endpoint);
    return NextResponse.json({ success: true });
  }

  if (action === "status") {
    const subs = await getSubscriptions();
    return NextResponse.json({ success: true, count: subs.length });
  }

  return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
}
