import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { addDays, daysBetween, levelForXp, streakMultiplier, toLocalDate } from './_helpers';
import type { Doc, Id } from './_generated/dataModel';
import { type MutationCtx, query } from './_generated/server';

const GRACE_PERIOD_DAYS = 1;

export const getMyStreak = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const currentStreak = user.currentStreak ?? 0;
    return {
      current: currentStreak,
      longest: user.longestStreak ?? 0,
      freezeTokens: user.streakFreezeTokens ?? 0,
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      multiplier: streakMultiplier(currentStreak),
    };
  },
});

export const getDayScores = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const today = toLocalDate(Date.now());
    const start = addDays(today, -(days - 1));

    const logs = await ctx.db
      .query('habitLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
      )
      .collect();

    const moods = await ctx.db
      .query('moodLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
      )
      .collect();

    const scoreByDay = new Map<string, { habits: number; mood: number | null }>();
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(start, offset);
      scoreByDay.set(date, { habits: 0, mood: null });
    }
    for (const log of logs) {
      const entry = scoreByDay.get(log.localDate);
      if (entry) entry.habits += 1;
    }
    for (const mood of moods) {
      const entry = scoreByDay.get(mood.localDate);
      if (entry) entry.mood = mood.mood;
    }

    return Array.from(scoreByDay.entries()).map(([date, v]) => ({ date, ...v }));
  },
});

/**
 * Recomputes streak from activity history. Does NOT award XP — call `awardXp`
 * separately from the specific log mutation so XP is attributed to exactly one
 * log event and never double-counted.
 */
export async function recomputeStreakForUser(ctx: MutationCtx, userId: Id<'users'>) {
  const user = (await ctx.db.get(userId)) as Doc<'users'> | null;
  if (!user) return;

  // While the streak is paused, freeze everything — don't decay, don't grow,
  // don't touch freeze tokens. Auto-clears when `streakPausedUntil` passes.
  if (user.streakPausedUntil && user.streakPausedUntil > Date.now()) {
    return;
  }

  const today = toLocalDate(Date.now());
  const start = addDays(today, -60);

  const [habitLogs, moodLogs] = await Promise.all([
    ctx.db
      .query('habitLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
      )
      .collect(),
    ctx.db
      .query('moodLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
      )
      .collect(),
  ]);

  const activeDays = new Set<string>();
  for (const log of habitLogs) activeDays.add(log.localDate);
  for (const mood of moodLogs) activeDays.add(mood.localDate);

  let streak = 0;
  let cursor = today;
  let graceUsed = 0;
  while (activeDays.has(cursor) || graceUsed < GRACE_PERIOD_DAYS) {
    if (activeDays.has(cursor)) {
      streak += 1;
    } else {
      if (streak === 0) break;
      graceUsed += 1;
    }
    cursor = addDays(cursor, -1);
    if (daysBetween(cursor, today) > 60) break;
  }

  const longest = Math.max(user.longestStreak ?? 0, streak);

  const currentFreezes = user.streakFreezeTokens ?? 0;
  const freezeTokens =
    activeDays.size > 0 && activeDays.size % 7 === 0 && currentFreezes < 2
      ? currentFreezes + 1
      : currentFreezes;

  await ctx.db.patch(userId, {
    currentStreak: streak,
    longestStreak: longest,
    streakFreezeTokens: freezeTokens,
  });
}

export interface XpAwardResult {
  gained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  multiplier: number;
}

/**
 * Awards XP for exactly ONE log event. Call this from the mutation that creates
 * the log (habitLogs.logCompletion or moodLogs.log) — never from recompute.
 */
export async function awardXp(
  ctx: MutationCtx,
  userId: Id<'users'>,
  kind: 'habit' | 'mood' | 'habit_minimum',
): Promise<XpAwardResult> {
  const user = (await ctx.db.get(userId)) as Doc<'users'> | null;
  if (!user) {
    return { gained: 0, totalXp: 0, level: 1, leveledUp: false, multiplier: 1 };
  }

  const base = kind === 'habit' ? 10 : kind === 'habit_minimum' ? 3 : 5;
  const multiplier = streakMultiplier(user.currentStreak ?? 0);
  const gained = Math.round(base * multiplier);
  const totalXp = (user.xp ?? 0) + gained;
  const prevLevel = user.level ?? 1;
  const level = levelForXp(totalXp);

  await ctx.db.patch(userId, { xp: totalXp, level });

  return { gained, totalXp, level, leveledUp: level > prevLevel, multiplier };
}
