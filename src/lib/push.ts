// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require("web-push");
import { kvGet, kvSet } from "@/lib/kv";

// VAPID keys for Web Push
export const VAPID_PUBLIC_KEY = "BLnl6ShjQq1VJhuCd0ygH4C1hSC-VAltDBqEGr7eRvNRu26n-MB5WV2nLCilstCWwzy6yGTiJe4mF9NoTqgXats";
const VAPID_PRIVATE_KEY = "kIquWC2t__ioMSn-GsIGEU27zhCfmoKZfRff2UJ_Eqg";

webpush.setVapidDetails(
  "mailto:concierge@loftlounge.ro",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const PUSH_SUBS_KEY = "push:subscriptions";

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function getSubscriptions(): Promise<PushSub[]> {
  return kvGet<PushSub[]>(PUSH_SUBS_KEY, []);
}

export async function saveSubscription(sub: PushSub): Promise<void> {
  const subs = await getSubscriptions();
  // Avoid duplicates
  if (subs.find((s) => s.endpoint === sub.endpoint)) return;
  subs.push(sub);
  await kvSet(PUSH_SUBS_KEY, subs);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const subs = await getSubscriptions();
  await kvSet(PUSH_SUBS_KEY, subs.filter((s) => s.endpoint !== endpoint));
}

export async function sendPushToAll(title: string, body: string, tag?: string): Promise<void> {
  const subs = await getSubscriptions();
  const payload = JSON.stringify({ title, body, tag: tag || "kuziini", icon: "/icons/icon-192.png" });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      )
    )
  );

  // Remove expired/invalid subscriptions
  const toRemove: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected" && (r.reason as { statusCode?: number })?.statusCode === 410) {
      toRemove.push(subs[i].endpoint);
    }
  });
  if (toRemove.length > 0) {
    const updated = subs.filter((s) => !toRemove.includes(s.endpoint));
    await kvSet(PUSH_SUBS_KEY, updated);
  }
}
