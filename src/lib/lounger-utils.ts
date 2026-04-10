import type { GuestProfile } from "@/types";
import type { UmbrellaConfig } from "@/lib/umbrella-config";

/** Parse lounger ID into prefix + number: "B-015" → { prefix: "B", number: 15 } */
export function parseLounger(id: string): { prefix: string; number: number } | null {
  const match = id.match(/^([A-Z]+)-(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], number: parseInt(match[2], 10) };
}

/** Format a lounger ID from prefix + number: ("B", 15) → "B-015" */
function formatLounger(prefix: string, num: number): string {
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}

/**
 * Suggest adjacent free loungers in the same zone.
 * Spirals outward from the selected lounger.
 * Returns up to (count - 1) suggestions (the selected one is already chosen).
 */
export function suggestAdjacentLoungers(
  selected: string,
  count: number,
  occupied: Set<string>,
  allLoungers: UmbrellaConfig[]
): string[] {
  if (count <= 1) return [];
  const parsed = parseLounger(selected);
  if (!parsed) return [];

  // Get all lounger numbers in the same zone
  const zoneNumbers = new Set<number>();
  const zoneLoungers = allLoungers.filter((l) => {
    const p = parseLounger(l.id);
    if (p && p.prefix === parsed.prefix) {
      zoneNumbers.add(p.number);
      return true;
    }
    return false;
  });

  const needed = count - 1;
  const suggestions: string[] = [];

  // Spiral outward: check +1, -1, +2, -2, +3, -3, ...
  for (let offset = 1; suggestions.length < needed && offset <= zoneLoungers.length; offset++) {
    for (const dir of [1, -1]) {
      if (suggestions.length >= needed) break;
      const num = parsed.number + offset * dir;
      if (!zoneNumbers.has(num)) continue;
      const id = formatLounger(parsed.prefix, num);
      if (!occupied.has(id) && id !== selected) {
        suggestions.push(id);
      }
    }
  }

  return suggestions;
}

/** Get today's date in Romania timezone */
export function todayRO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

/** Find guest that occupies a specific lounger (checks loungerIds array) */
export function getGuestForLounger(
  guests: GuestProfile[],
  loungerId: string,
  today?: string
): GuestProfile | undefined {
  const d = today || todayRO();
  return guests.find(
    (g) =>
      (g.loungerIds?.includes(loungerId) || g.loungerId === loungerId) &&
      g.stayStart <= d &&
      g.stayEnd >= d &&
      g.status !== "checked_out"
  );
}

/** Find guest by any member phone */
export function getGuestByPhone(
  guests: GuestProfile[],
  phone: string,
  today?: string
): GuestProfile | undefined {
  const d = today || todayRO();
  return guests.find(
    (g) =>
      (g.members?.some((m) => m.phone === phone) || g.phone === phone) &&
      g.stayStart <= d &&
      g.stayEnd >= d &&
      g.status !== "checked_out"
  );
}

/** Get all phone numbers for a guest card */
export function getAllPhonesForGuest(guest: GuestProfile): string[] {
  if (guest.members && guest.members.length > 0) {
    return guest.members.map((m) => m.phone);
  }
  return [guest.phone];
}

/** Get all occupied lounger IDs from a list of guests */
export function getOccupiedLoungers(guests: GuestProfile[], today?: string): Set<string> {
  const d = today || todayRO();
  const occupied = new Set<string>();
  for (const g of guests) {
    if (g.status === "checked_out" || g.stayStart > d || g.stayEnd < d) continue;
    if (g.loungerIds) {
      for (const lid of g.loungerIds) occupied.add(lid);
    } else if (g.loungerId) {
      occupied.add(g.loungerId);
    }
  }
  return occupied;
}
