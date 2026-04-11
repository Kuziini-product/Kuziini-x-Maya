/**
 * Shared guest data access layer.
 * Used by all /api/admin/guests/* routes to avoid duplicating KV logic.
 */

import { kvGet, kvSet } from "@/lib/kv";
import { migrateGuests } from "@/lib/migrate-guests";
import type { GuestProfile } from "@/types";

const KV_KEY = "guests:registry";

export async function getGuests(): Promise<GuestProfile[]> {
  const raw = await kvGet<GuestProfile[]>(KV_KEY, []);
  return migrateGuests(raw);
}

export async function saveGuests(list: GuestProfile[]): Promise<void> {
  await kvSet(KV_KEY, list);
}
