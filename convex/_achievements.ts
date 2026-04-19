/**
 * Stable achievement definitions. Never rename `id` — user unlock rows
 * reference it. `icon` is an Ionicons name (not an emoji) so the mobile UI
 * can render it consistently with the rest of the app chrome.
 */

export type AchievementCategory = 'streak' | 'habits' | 'mood' | 'social' | 'hidden';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  nameKey: string;
  descriptionKey: string;
  icon: string; // Ionicons glyph name, e.g. 'flame', 'trophy'
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_week',
    category: 'streak',
    nameKey: 'achievement.firstWeek.name',
    descriptionKey: 'achievement.firstWeek.description',
    icon: 'flame',
    xpReward: 100,
  },
  {
    id: 'streak_30',
    category: 'streak',
    nameKey: 'achievement.streak30.name',
    descriptionKey: 'achievement.streak30.description',
    icon: 'star',
    xpReward: 500,
  },
  {
    id: 'sleep_champion',
    category: 'habits',
    nameKey: 'achievement.sleepChampion.name',
    descriptionKey: 'achievement.sleepChampion.description',
    icon: 'moon',
    xpReward: 200,
  },
  {
    id: 'hydration_hero',
    category: 'habits',
    nameKey: 'achievement.hydrationHero.name',
    descriptionKey: 'achievement.hydrationHero.description',
    icon: 'water',
    xpReward: 200,
  },
  {
    id: 'mind_master',
    category: 'mood',
    nameKey: 'achievement.mindMaster.name',
    descriptionKey: 'achievement.mindMaster.description',
    icon: 'flower',
    xpReward: 250,
  },
  {
    id: 'comeback_kid',
    category: 'streak',
    nameKey: 'achievement.comebackKid.name',
    descriptionKey: 'achievement.comebackKid.description',
    icon: 'refresh-circle',
    xpReward: 150,
  },
  {
    id: 'first_friend',
    category: 'social',
    nameKey: 'achievement.firstFriend.name',
    descriptionKey: 'achievement.firstFriend.description',
    icon: 'people',
    xpReward: 50,
  },
  {
    id: 'challenge_finisher',
    category: 'social',
    nameKey: 'achievement.challengeFinisher.name',
    descriptionKey: 'achievement.challengeFinisher.description',
    icon: 'trophy',
    xpReward: 300,
  },
  {
    id: 'level_10',
    category: 'streak',
    nameKey: 'achievement.level10.name',
    descriptionKey: 'achievement.level10.description',
    icon: 'medal',
    xpReward: 100,
  },
  {
    id: 'mood_journaling_week',
    category: 'mood',
    nameKey: 'achievement.moodJournalingWeek.name',
    descriptionKey: 'achievement.moodJournalingWeek.description',
    icon: 'journal',
    xpReward: 150,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
