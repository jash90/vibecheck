/**
 * Focus-category vocabulary + normalization.
 *
 * The historical habit.category enum uses `mental` / `physical`; focusCategories
 * uses `mood` / `movement`. This module is the single source of truth that
 * maps between them so every server-side feature (tips, challenges, insights,
 * notifications, weekly review) can reliably check "does this habit match the
 * user's focus?".
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

/**
 * Collapse the habit-category vocabulary onto the focus-category vocabulary.
 * `mental` → `mood`, `physical` → `movement`. Unknown values pass through
 * untouched so downstream code can still carry them.
 */
export function normalizeCategory(cat: string): FocusCategory | string {
  if (cat === 'mental') return 'mood';
  if (cat === 'physical') return 'movement';
  return cat;
}

/**
 * True iff a habit belongs to any of the user's focus areas, under the
 * normalized vocabulary. Treats `mindfulness` as a near-neighbor of `mood`
 * so a user who picks "mood" still sees meditation/breathing tips ranked up.
 */
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
