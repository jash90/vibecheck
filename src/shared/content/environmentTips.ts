import type { FocusCategory } from '@shared/constants/focus';

/**
 * Heath-style environment design tips. Each tip is one small, concrete change
 * to a user's physical setup that nudges a habit into place. Framed as
 * experiments (not rules) — Rebels benefit and so does everyone else.
 *
 * Stable IDs. i18n keys resolve to `envTip.<id>` in the locale JSONs.
 */

export interface EnvironmentTip {
  id: string;
  category: FocusCategory;
  /** Rough effort to set up once. Used as a hint in the UI. */
  effort: '30s' | '5min' | '15min';
}

export const ENVIRONMENT_TIPS: EnvironmentTip[] = [
  // Hydration
  { id: 'bedsideBottle', category: 'hydration', effort: '30s' },
  { id: 'deskGlass', category: 'hydration', effort: '30s' },
  { id: 'bagBottle', category: 'hydration', effort: '30s' },
  { id: 'morningBrushGlass', category: 'hydration', effort: '30s' },

  // Sleep
  { id: 'chargerOutside', category: 'sleep', effort: '5min' },
  { id: 'realAlarm', category: 'sleep', effort: '15min' },
  { id: 'clothesReady', category: 'sleep', effort: '5min' },
  { id: 'bedroomTemp', category: 'sleep', effort: '5min' },

  // Movement
  { id: 'shoesByDoor', category: 'movement', effort: '30s' },
  { id: 'gearReady', category: 'movement', effort: '5min' },
  { id: 'backpackOutside', category: 'movement', effort: '30s' },
  { id: 'stairsDefault', category: 'movement', effort: '30s' },

  // Mindfulness
  { id: 'meditationChair', category: 'mindfulness', effort: '30s' },
  { id: 'meditationAppFirst', category: 'mindfulness', effort: '5min' },
  { id: 'notificationsOff', category: 'mindfulness', effort: '5min' },

  // Nutrition
  { id: 'fruitBowl', category: 'nutrition', effort: '30s' },
  { id: 'breakfastReady', category: 'nutrition', effort: '15min' },
  { id: 'sweetsHidden', category: 'nutrition', effort: '30s' },

  // Mood (reading, journaling, connection)
  { id: 'bookOnPillow', category: 'mood', effort: '30s' },
  { id: 'journalBySide', category: 'mood', effort: '30s' },
  { id: 'phoneOutOfBedroom', category: 'mood', effort: '5min' },
];

export function tipsForCategory(category: FocusCategory): EnvironmentTip[] {
  return ENVIRONMENT_TIPS.filter((t) => t.category === category);
}

export function tipById(id: string): EnvironmentTip | undefined {
  return ENVIRONMENT_TIPS.find((t) => t.id === id);
}

/** Deterministic per-day rotation so tips don't churn between renders. */
export function pickTipForCategory(
  category: FocusCategory,
  seed: number = Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
): EnvironmentTip | undefined {
  const bucket = tipsForCategory(category);
  if (bucket.length === 0) return undefined;
  return bucket[seed % bucket.length];
}
