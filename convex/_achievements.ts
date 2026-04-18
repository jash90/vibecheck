/**
 * Stable achievement definitions. Never rename `id` — user unlock rows
 * reference it. Icons are unicode emoji so they render without asset
 * bundling in Phase 2.
 */

export type AchievementCategory = 'streak' | 'habits' | 'mood' | 'social' | 'hidden';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_week',
    category: 'streak',
    nameKey: 'achievement.firstWeek.name',
    descriptionKey: 'achievement.firstWeek.description',
    icon: '🔥',
    xpReward: 100,
  },
  {
    id: 'streak_30',
    category: 'streak',
    nameKey: 'achievement.streak30.name',
    descriptionKey: 'achievement.streak30.description',
    icon: '🌟',
    xpReward: 500,
  },
  {
    id: 'sleep_champion',
    category: 'habits',
    nameKey: 'achievement.sleepChampion.name',
    descriptionKey: 'achievement.sleepChampion.description',
    icon: '😴',
    xpReward: 200,
  },
  {
    id: 'hydration_hero',
    category: 'habits',
    nameKey: 'achievement.hydrationHero.name',
    descriptionKey: 'achievement.hydrationHero.description',
    icon: '💧',
    xpReward: 200,
  },
  {
    id: 'mind_master',
    category: 'mood',
    nameKey: 'achievement.mindMaster.name',
    descriptionKey: 'achievement.mindMaster.description',
    icon: '🧘',
    xpReward: 250,
  },
  {
    id: 'comeback_kid',
    category: 'streak',
    nameKey: 'achievement.comebackKid.name',
    descriptionKey: 'achievement.comebackKid.description',
    icon: '💪',
    xpReward: 150,
  },
  {
    id: 'first_friend',
    category: 'social',
    nameKey: 'achievement.firstFriend.name',
    descriptionKey: 'achievement.firstFriend.description',
    icon: '👥',
    xpReward: 50,
  },
  {
    id: 'challenge_finisher',
    category: 'social',
    nameKey: 'achievement.challengeFinisher.name',
    descriptionKey: 'achievement.challengeFinisher.description',
    icon: '🏆',
    xpReward: 300,
  },
  {
    id: 'level_10',
    category: 'streak',
    nameKey: 'achievement.level10.name',
    descriptionKey: 'achievement.level10.description',
    icon: '⭐',
    xpReward: 100,
  },
  {
    id: 'mood_journaling_week',
    category: 'mood',
    nameKey: 'achievement.moodJournalingWeek.name',
    descriptionKey: 'achievement.moodJournalingWeek.description',
    icon: '📓',
    xpReward: 150,
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
