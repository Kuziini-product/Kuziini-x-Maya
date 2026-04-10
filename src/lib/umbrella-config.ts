/**
 * Master configuration for all 400 umbrellas.
 * Distribution: Zona Lounge 120 | Zona Beach 200 | VIP Premium 80
 */

export interface UmbrellaConfig {
  id: string;
  zone: string;
}

function generate(prefix: string, zone: string, count: number, startFrom = 1): UmbrellaConfig[] {
  const results: UmbrellaConfig[] = [];
  for (let i = startFrom; i < startFrom + count; i++) {
    const num = i.toString().padStart(3, "0");
    results.push({ id: `${prefix}-${num}`, zone });
  }
  return results;
}

export const ALL_UMBRELLAS: UmbrellaConfig[] = [
  ...generate("A", "Zona Lounge", 120),     // A-001 → A-120
  ...generate("B", "Zona Beach", 200),       // B-001 → B-200
  ...generate("VIP", "VIP Premium", 80),     // VIP-001 → VIP-080
];

export const ZONES = ["Zona Lounge", "Zona Beach", "VIP Premium"] as const;

export function getUmbrellasByZone(): Record<string, UmbrellaConfig[]> {
  const map: Record<string, UmbrellaConfig[]> = {};
  for (const u of ALL_UMBRELLAS) {
    if (!map[u.zone]) map[u.zone] = [];
    map[u.zone].push(u);
  }
  return map;
}
