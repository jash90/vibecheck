export function toLocalDate(timestamp: number, timezoneOffsetMinutes = 0): string {
  const adjusted = new Date(timestamp - timezoneOffsetMinutes * 60 * 1000);
  const y = adjusted.getUTCFullYear();
  const m = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(adjusted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  const parts = date.split('-').map((x) => Number.parseInt(x, 10));
  const [y, m, d] = parts as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toLocalDate(dt.getTime());
}

export function daysBetween(a: string, b: string): number {
  const parse = (s: string): number => {
    const parts = s.split('-').map((x) => Number.parseInt(x, 10));
    const [y, m, d] = parts as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(b) - parse(a)) / (1000 * 60 * 60 * 24));
}

export function levelForXp(xp: number): number {
  // Simple tier: each level requires 100 XP more than the last. L1→L2: 100, L2→L3: 200, ...
  let level = 1;
  let required = 100;
  let remaining = xp;
  while (remaining >= required && level < 50) {
    remaining -= required;
    level += 1;
    required = level * 100;
  }
  return level;
}

export function streakMultiplier(streak: number): number {
  // 1.0x at streak=0, 1.1x compounding up to cap 2.0x at streak 30
  return Math.min(2, 1 + streak * 0.0333);
}
