import { type FocusCategory } from '@shared/constants/focus';

export type TemplateCategory =
  | 'mental'
  | 'physical'
  | 'sleep'
  | 'nutrition'
  | 'mindfulness'
  | 'hydration';

export type TemplateFrequency = 'daily' | '3x_week' | 'weekly';

export interface HabitTemplate {
  id: string;
  focus: FocusCategory;
  category: TemplateCategory;
  frequency: TemplateFrequency;
  /** i18n key under `habitTemplates.` */
  nameKey: string;
  targetValue?: number;
  targetUnit?: 'min' | 'glass' | 'step' | 'page' | 'meal';
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // sleep
  { id: 'sleep_by_23', focus: 'sleep', category: 'sleep', frequency: 'daily', nameKey: 'sleepBy23' },
  { id: 'no_screens_after_22', focus: 'sleep', category: 'sleep', frequency: 'daily', nameKey: 'noScreensAfter22' },
  { id: 'wind_down_routine', focus: 'sleep', category: 'sleep', frequency: 'daily', nameKey: 'windDownRoutine', targetValue: 15, targetUnit: 'min' },

  // movement (maps to physical)
  { id: 'walk_30min', focus: 'movement', category: 'physical', frequency: 'daily', nameKey: 'walk30Min', targetValue: 30, targetUnit: 'min' },
  { id: 'stretch_10min', focus: 'movement', category: 'physical', frequency: 'daily', nameKey: 'stretch10Min', targetValue: 10, targetUnit: 'min' },
  { id: 'workout_3x', focus: 'movement', category: 'physical', frequency: '3x_week', nameKey: 'workout3x', targetValue: 30, targetUnit: 'min' },

  // hydration
  { id: 'water_2l', focus: 'hydration', category: 'hydration', frequency: 'daily', nameKey: 'water2L', targetValue: 8, targetUnit: 'glass' },
  { id: 'water_morning', focus: 'hydration', category: 'hydration', frequency: 'daily', nameKey: 'waterMorning', targetValue: 1, targetUnit: 'glass' },

  // mood (maps to mental)
  { id: 'journal_3_sentences', focus: 'mood', category: 'mental', frequency: 'daily', nameKey: 'journal3Sentences' },
  { id: 'gratitude_1', focus: 'mood', category: 'mental', frequency: 'daily', nameKey: 'gratitude1' },
  { id: 'check_in_friend', focus: 'mood', category: 'mental', frequency: 'daily', nameKey: 'checkInFriend' },

  // mindfulness
  { id: 'breathing_4_7_8', focus: 'mindfulness', category: 'mindfulness', frequency: 'daily', nameKey: 'breathing478', targetValue: 5, targetUnit: 'min' },
  { id: 'meditation_10min', focus: 'mindfulness', category: 'mindfulness', frequency: 'daily', nameKey: 'meditation10Min', targetValue: 10, targetUnit: 'min' },
  { id: 'phone_free_hour', focus: 'mindfulness', category: 'mindfulness', frequency: 'daily', nameKey: 'phoneFreeHour' },

  // nutrition
  { id: 'protein_breakfast', focus: 'nutrition', category: 'nutrition', frequency: 'daily', nameKey: 'proteinBreakfast' },
  { id: 'veg_two_colors', focus: 'nutrition', category: 'nutrition', frequency: 'daily', nameKey: 'vegTwoColors' },
  { id: 'no_soda', focus: 'nutrition', category: 'nutrition', frequency: 'daily', nameKey: 'noSoda' },
];

export function templatesForFocus(focus: readonly string[] | undefined | null): HabitTemplate[] {
  if (!focus || focus.length === 0) return HABIT_TEMPLATES;
  const ordered: HabitTemplate[] = [];
  const seen = new Set<string>();
  for (const f of focus) {
    for (const tpl of HABIT_TEMPLATES) {
      if (tpl.focus === f && !seen.has(tpl.id)) {
        ordered.push(tpl);
        seen.add(tpl.id);
      }
    }
  }
  return ordered;
}
