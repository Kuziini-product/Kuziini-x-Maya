import { kv } from "@vercel/kv";

/**
 * Persistent KV store with in-memory fallback for local dev.
 * Uses Vercel KV (Redis) in production; falls back to a Map when
 * KV_REST_API_URL is not configured.
 */

const memoryStore = new Map<string, unknown>();

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (isKvConfigured()) {
    try {
      const data = await kv.get<T>(key);
      return data ?? fallback;
    } catch {
      return fallback;
    }
  }
  // In-memory fallback
  const val = memoryStore.get(key);
  return (val as T) ?? fallback;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (isKvConfigured()) {
    try {
      await kv.set(key, value);
    } catch {
      // silently fall back to memory
      memoryStore.set(key, value);
    }
    return;
  }
  memoryStore.set(key, value);
}
