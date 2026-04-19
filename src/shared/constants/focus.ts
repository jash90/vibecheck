/**
 * Client-side mirror of `convex/_focus.ts`. Keeps the focus vocabulary and
 * normalization identical across server + client so every feature that
 * ranks/filters by focus uses the same rules.
 */

export type FocusCategory =
  | 'sleep'
  | 'movement'
  | 'hydration'
  | 'mood'
  | 'mindfulness'
  | 'nutrition';

export const FOCUS_CATEGORIES: readonly FocusCategory[] = [
  'sleep',
  'movement',
  'hydration',
  'mood',
  'mindfulness',
  'nutrition',
] as const;

export function normalizeCategory(cat: string): FocusCategory | string {
  if (cat === 'mental') return 'mood';
  if (cat === 'physical') return 'movement';
  return cat;
}

export function habitCategoryMatchesFocus(
  habitCategory: string,
  focus: readonly string[] | null | undefined,
): boolean {
  if (!focus || focus.length === 0) return false;
  const normalized = normalizeCategory(habitCategory);
  if (focus.includes(normalized)) return true;
  if (normalized === 'mindfulness' && focus.includes('mood')) return true;
  if (normalized === 'mood' && focus.includes('mindfulness')) return true;
  return false;
}
