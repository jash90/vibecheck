import { getAuthUserId } from '@convex-dev/auth/server';

import type { Id } from './_generated/dataModel';
import { type MutationCtx, query } from './_generated/server';

export type LifeSkill =
  | 'sleep_mastery'
  | 'physical_resilience'
  | 'emotional_intelligence'
  | 'body_awareness'
  | 'discipline';

const ALL_SKILLS: LifeSkill[] = [
  'sleep_mastery',
  'physical_resilience',
  'emotional_intelligence',
  'body_awareness',
  'discipline',
];

/**
 * Skill XP thresholds for each level (1..5). Simple progression — future
 * phases can make these dynamic based on age/difficulty.
 */
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000];

export function skillLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= (LEVEL_THRESHOLDS[i] ?? Infinity)) level = i + 1;
    else break;
  }
  return Math.min(5, level);
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const existing = await ctx.db
      .query('lifeSkills')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const existingMap = new Map(existing.map((s) => [s.skill, s]));

    return ALL_SKILLS.map((skill) => {
      const record = existingMap.get(skill);
      return {
        skill,
        xp: record?.xp ?? 0,
        level: record?.level ?? 1,
      };
    });
  },
});

/**
 * Increments skill XP based on the category of the habit just logged.
 * Mapping:
 *   sleep     → sleep_mastery
 *   physical  → physical_resilience
 *   mindfulness / mental → emotional_intelligence
 *   hydration / nutrition → body_awareness
 *   <any>     → discipline (always +1 for consistency)
 */
export async function addSkillXpFromHabit(
  ctx: MutationCtx,
  userId: Id<'users'>,
  category: string,
) {
  const mapping: Record<string, LifeSkill> = {
    sleep: 'sleep_mastery',
    physical: 'physical_resilience',
    movement: 'physical_resilience',
    mindfulness: 'emotional_intelligence',
    mental: 'emotional_intelligence',
    mood: 'emotional_intelligence',
    hydration: 'body_awareness',
    nutrition: 'body_awareness',
  };

  const primary = mapping[category];
  const toBump: [LifeSkill, number][] = [];
  if (primary) toBump.push([primary, 10]);
  toBump.push(['discipline', 3]);

  for (const [skill, gain] of toBump) {
    const existing = await ctx.db
      .query('lifeSkills')
      .withIndex('by_user_and_skill', (q) => q.eq('userId', userId).eq('skill', skill))
      .take(1);
    const current = existing[0];
    const nextXp = (current?.xp ?? 0) + gain;
    const nextLevel = skillLevelFromXp(nextXp);
    if (current) {
      await ctx.db.patch(current._id, {
        xp: nextXp,
        level: nextLevel,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('lifeSkills', {
        userId,
        skill,
        xp: nextXp,
        level: nextLevel,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function addSkillXpFromMood(ctx: MutationCtx, userId: Id<'users'>) {
  const skill: LifeSkill = 'emotional_intelligence';
  const gain = 8;
  const existing = await ctx.db
    .query('lifeSkills')
    .withIndex('by_user_and_skill', (q) => q.eq('userId', userId).eq('skill', skill))
    .take(1);
  const current = existing[0];
  const nextXp = (current?.xp ?? 0) + gain;
  const nextLevel = skillLevelFromXp(nextXp);
  if (current) {
    await ctx.db.patch(current._id, { xp: nextXp, level: nextLevel, updatedAt: Date.now() });
  } else {
    await ctx.db.insert('lifeSkills', {
      userId,
      skill,
      xp: nextXp,
      level: nextLevel,
      updatedAt: Date.now(),
    });
  }
}
