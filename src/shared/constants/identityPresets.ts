import type { FocusCategory } from './focus';

/**
 * Identity statement presets per focus category. Each preset is a full
 * "I'm becoming a person who…" sentence. Keys reference i18n entries
 * under `identity.preset.<category>.<index>`.
 *
 * Each preset is keyed by a stable string ID so the value survives
 * re-ordering or re-wording of the Polish copy. When the user picks a
 * preset, we store the *rendered* text as `identityStatements[category]`,
 * not the preset ID — the ID is a pointer, the text is the truth.
 */
export interface IdentityPreset {
  id: string;
  /** i18n key under `identity.preset.<category>.<id>` */
  i18nKey: string;
}

export const IDENTITY_PRESETS: Record<FocusCategory, IdentityPreset[]> = {
  sleep: [
    { id: 'sleepCares', i18nKey: 'identity.preset.sleep.cares' },
    { id: 'sleepKnowsWhen', i18nKey: 'identity.preset.sleep.knowsWhen' },
    { id: 'sleepProtects', i18nKey: 'identity.preset.sleep.protects' },
  ],
  movement: [
    { id: 'moveDailyBody', i18nKey: 'identity.preset.movement.dailyBody' },
    { id: 'moveEveryDay', i18nKey: 'identity.preset.movement.everyDay' },
    { id: 'moveEnjoys', i18nKey: 'identity.preset.movement.enjoys' },
  ],
  hydration: [
    { id: 'hydrateSelf', i18nKey: 'identity.preset.hydration.cares' },
    { id: 'hydrateListens', i18nKey: 'identity.preset.hydration.listens' },
  ],
  mood: [
    { id: 'moodKnowsEmotions', i18nKey: 'identity.preset.mood.knowsEmotions' },
    { id: 'moodSelfCare', i18nKey: 'identity.preset.mood.selfCare' },
    { id: 'moodChecksIn', i18nKey: 'identity.preset.mood.checksIn' },
  ],
  mindfulness: [
    { id: 'mindfulStops', i18nKey: 'identity.preset.mindfulness.stops' },
    { id: 'mindfulRituals', i18nKey: 'identity.preset.mindfulness.rituals' },
    { id: 'mindfulPresent', i18nKey: 'identity.preset.mindfulness.present' },
  ],
  nutrition: [
    { id: 'nutritionMindful', i18nKey: 'identity.preset.nutrition.mindful' },
    { id: 'nutritionListens', i18nKey: 'identity.preset.nutrition.listens' },
    { id: 'nutritionFuels', i18nKey: 'identity.preset.nutrition.fuels' },
  ],
};
