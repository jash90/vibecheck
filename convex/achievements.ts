import { getAuthUserId } from '@convex-dev/auth/server';

import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from './_achievements';
import { addDays, toLocalDate } from './_helpers';
import type { Doc, Id } from './_generated/dataModel';
import { type MutationCtx, query } from './_generated/server';

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const unlocked = await ctx.db
      .query('userAchievements')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    return ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) ?? null,
    }));
  },
});

/**
 * Checks all achievement conditions for a user and unlocks any that are newly
 * met. Awards XP for each new unlock. Called from `awardXp` and streak
 * recompute — idempotent (won't re-unlock already unlocked achievements).
 */
export async function detectAndUnlockAchievements(
  ctx: MutationCtx,
  userId: Id<'users'>,
): Promise<string[]> {
  const user = (await ctx.db.get(userId)) as Doc<'users'> | null;
  if (!user) return [];

  const existing = await ctx.db
    .query('userAchievements')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const unlockedSet = new Set(existing.map((e) => e.achievementId));

  const newly: string[] = [];
  const today = toLocalDate(Date.now());

  async function tryUnlock(id: string, condition: boolean | Promise<boolean>) {
    if (unlockedSet.has(id)) return;
    const met = await condition;
    if (!met) return;
    const def = ACHIEVEMENT_BY_ID[id];
    if (!def) return;
    await ctx.db.insert('userAchievements', {
      userId,
      achievementId: id,
      unlockedAt: Date.now(),
    });
    newly.push(id);
    if (user) {
      await ctx.db.patch(userId, { xp: (user.xp ?? 0) + def.xpReward });
    }
  }

  // streak-based
  await tryUnlock('first_week', user.currentStreak >= 7);
  await tryUnlock('streak_30', user.currentStreak >= 30);
  await tryUnlock('level_10', user.level >= 10);

  // mood journaling week: 7 consecutive days with mood entries
  const sevenDaysAgo = addDays(today, -6);
  const moodsLast7 = await ctx.db
    .query('moodLogs')
    .withIndex('by_user_and_date', (q) =>
      q.eq('userId', userId).gte('localDate', sevenDaysAgo).lte('localDate', today),
    )
    .collect();
  const uniqueMoodDays = new Set(moodsLast7.map((m) => m.localDate));
  await tryUnlock('mood_journaling_week', uniqueMoodDays.size >= 7);

  // habit-category champions: 7 unique days with a log in that category
  const habitsMine = await ctx.db
    .query('habits')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const habitCategory = new Map(habitsMine.map((h) => [h._id, h.category]));

  const logsLast7 = await ctx.db
    .query('habitLogs')
    .withIndex('by_user_and_date', (q) =>
      q.eq('userId', userId).gte('localDate', sevenDaysAgo).lte('localDate', today),
    )
    .collect();

  const daysByCategory = new Map<string, Set<string>>();
  for (const log of logsLast7) {
    const cat = habitCategory.get(log.habitId);
    if (!cat) continue;
    const set = daysByCategory.get(cat) ?? new Set<string>();
    set.add(log.localDate);
    daysByCategory.set(cat, set);
  }
  await tryUnlock('sleep_champion', (daysByCategory.get('sleep')?.size ?? 0) >= 7);
  await tryUnlock('hydration_hero', (daysByCategory.get('hydration')?.size ?? 0) >= 7);
  await tryUnlock('mind_master', (daysByCategory.get('mindfulness')?.size ?? 0) >= 7);

  // social: has at least one active friend
  const asA = await ctx.db
    .query('friendships')
    .withIndex('by_userA', (q) => q.eq('userAId', userId).eq('status', 'active'))
    .take(1);
  const asB = await ctx.db
    .query('friendships')
    .withIndex('by_userB', (q) => q.eq('userBId', userId).eq('status', 'active'))
    .take(1);
  await tryUnlock('first_friend', asA.length > 0 || asB.length > 0);

  return newly;
}
