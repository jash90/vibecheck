/**
 * Pure function: compute habit→mood correlation over last N days.
 * No AI — just simple averages. Returned for display + seeding Claude's
 * weekly report.
 */

interface DayRecord {
  date: string;
  habitsByCategory: Record<string, number>;
  mood: number | null;
}

export interface CorrelationResult {
  category: string;
  moodOnActiveDays: number | null;
  moodOnInactiveDays: number | null;
  delta: number | null;
  activeDays: number;
  inactiveDays: number;
}

export function computeCorrelations(days: DayRecord[]): CorrelationResult[] {
  const withMood = days.filter((d) => d.mood !== null);
  if (withMood.length < 4) return []; // need at least 4 mood entries

  const categories = new Set<string>();
  for (const d of days) {
    for (const cat of Object.keys(d.habitsByCategory)) categories.add(cat);
  }

  const results: CorrelationResult[] = [];
  for (const cat of categories) {
    const active = withMood.filter((d) => (d.habitsByCategory[cat] ?? 0) > 0);
    const inactive = withMood.filter((d) => (d.habitsByCategory[cat] ?? 0) === 0);
    if (active.length === 0 || inactive.length === 0) continue;

    const avg = (xs: DayRecord[]) =>
      xs.reduce((acc, d) => acc + (d.mood ?? 0), 0) / xs.length;
    const moodOnActive = avg(active);
    const moodOnInactive = avg(inactive);

    results.push({
      category: cat,
      moodOnActiveDays: moodOnActive,
      moodOnInactiveDays: moodOnInactive,
      delta: moodOnActive - moodOnInactive,
      activeDays: active.length,
      inactiveDays: inactive.length,
    });
  }

  results.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  return results;
}
