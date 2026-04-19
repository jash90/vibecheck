import { type FocusCategory } from '@shared/constants/focus';

export type ChallengeCategory =
  | 'mental'
  | 'physical'
  | 'sleep'
  | 'nutrition'
  | 'mindfulness'
  | 'hydration'
  | 'mixed';

export interface ChallengeTemplate {
  id: string;
  focus: FocusCategory | 'mixed';
  category: ChallengeCategory;
  durationDays: number;
  targetPerPerson: number;
  /** i18n key under `challengeTemplates.<key>.title` and `.description` */
  key: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  { id: 'sleep_7days', focus: 'sleep', category: 'sleep', durationDays: 7, targetPerPerson: 7, key: 'sleep7Days' },
  { id: 'sleep_by_23', focus: 'sleep', category: 'sleep', durationDays: 14, targetPerPerson: 10, key: 'sleepBy23Challenge' },

  { id: 'walk_7days', focus: 'movement', category: 'physical', durationDays: 7, targetPerPerson: 7, key: 'walk7Days' },
  { id: 'workout_30_days', focus: 'movement', category: 'physical', durationDays: 30, targetPerPerson: 12, key: 'workout30Days' },

  { id: 'water_14days', focus: 'hydration', category: 'hydration', durationDays: 14, targetPerPerson: 14, key: 'water14Days' },

  { id: 'mood_checkin_week', focus: 'mood', category: 'mental', durationDays: 7, targetPerPerson: 7, key: 'moodCheckinWeek' },
  { id: 'gratitude_14days', focus: 'mood', category: 'mental', durationDays: 14, targetPerPerson: 14, key: 'gratitude14Days' },

  { id: 'breath_daily_week', focus: 'mindfulness', category: 'mindfulness', durationDays: 7, targetPerPerson: 7, key: 'breathDailyWeek' },
  { id: 'phone_free_hour_14', focus: 'mindfulness', category: 'mindfulness', durationDays: 14, targetPerPerson: 10, key: 'phoneFreeHour14' },

  { id: 'protein_breakfast_7', focus: 'nutrition', category: 'nutrition', durationDays: 7, targetPerPerson: 7, key: 'proteinBreakfast7' },

  { id: 'all_rounder_7', focus: 'mixed', category: 'mixed', durationDays: 7, targetPerPerson: 7, key: 'allRounder7' },
];

export function challengeTemplatesForFocus(
  focus: readonly string[] | undefined | null,
): ChallengeTemplate[] {
  if (!focus || focus.length === 0) {
    return CHALLENGE_TEMPLATES.filter((t) => t.focus === 'mixed').concat(
      CHALLENGE_TEMPLATES.filter((t) => t.focus !== 'mixed'),
    );
  }
  const ordered: ChallengeTemplate[] = [];
  const seen = new Set<string>();
  for (const f of focus) {
    for (const tpl of CHALLENGE_TEMPLATES) {
      if (tpl.focus === f && !seen.has(tpl.id)) {
        ordered.push(tpl);
        seen.add(tpl.id);
      }
    }
  }
  for (const tpl of CHALLENGE_TEMPLATES) {
    if (tpl.focus === 'mixed' && !seen.has(tpl.id)) {
      ordered.push(tpl);
      seen.add(tpl.id);
    }
  }
  return ordered;
}
