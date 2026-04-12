/**
 * Server-side umbrella session storage.
 * Tracks who owns each umbrella, who joined as guest, and pending join requests.
 */

import { kvGet, kvSet } from "@/lib/kv";

export interface UmbrellaSessionMember {
  phone: string;
  name: string;
  email?: string;
  joinedAt: string;
}

export interface UmbrellaJoinRequest {
  id: string;
  phone: string;
  name: string;
  email?: string;
  requestedAt: string;
}

export interface UmbrellaSession {
  umbrellaId: string;
  sessionId: string;
  ownerPhone: string;
  ownerName: string;
  ownerEmail?: string;
  startedAt: string;
  closed: boolean;
  members: UmbrellaSessionMember[]; // includes owner as first entry
  pendingRequests: UmbrellaJoinRequest[];
}

const KV_PREFIX = "umbrella-session:";

export async function getUmbrellaSession(umbrellaId: string): Promise<UmbrellaSession | null> {
  return kvGet<UmbrellaSession | null>(`${KV_PREFIX}${umbrellaId}`, null);
}

export async function saveUmbrellaSession(session: UmbrellaSession): Promise<void> {
  await kvSet(`${KV_PREFIX}${session.umbrellaId}`, session);
}

export async function clearUmbrellaSession(umbrellaId: string): Promise<void> {
  await kvSet(`${KV_PREFIX}${umbrellaId}`, null);
}

/**
 * Check if a phone number belongs to the owner or any approved member of a session.
 */
export function isMemberOfSession(session: UmbrellaSession | null, phone: string): boolean {
  if (!session || session.closed) return false;
  return session.members.some((m) => m.phone === phone);
}

/**
 * Check if a phone is the owner of a session.
 */
export function isOwnerOfSession(session: UmbrellaSession | null, phone: string): boolean {
  if (!session || session.closed) return false;
  return session.ownerPhone === phone;
}
