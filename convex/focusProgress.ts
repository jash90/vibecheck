import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { normalizeCategory, type FocusCategory } from './_focus';
import { addDays, toLocalDate } from './_helpers';
import { query } from './_generated/server';

interface FocusBucket {
  focus: FocusCategory;
  activeDays: number;  // days in window with at least one matching habit logged
  logCount: number;
  habitCount: number;  // active habits mapped to this focus
  score: number;       // activeDays / 7
}

/**
 * Weekly progress per focus area. Used by the home progress rings and the
 * weekly review screen to answer "how am I doing on what I said matters?".
 */
export const weeklyByFocus = query({
  args: {},
  handler: async (ctx): Promise<{ buckets: FocusBucket[]; activeDays: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { buckets: [], activeDays: 0 };

    const user = await ctx.db.get(userId);
    const focus = (user && 'focusCategories' in user
      ? (user.focusCategories as FocusCategory[] | undefined)
      : undefined) ?? [];

    const today = toLocalDate(Date.now());
    const start = addDays(today, -6);

    const [habits, habitLogs] = await Promise.all([
      ctx.db
        .query('habits')
        .withIndex('by_user', (q) => q.eq('userId', userId).eq('isActive', true))
        .collect(),
      ctx.db
        .query('habitLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
    ]);

    const habitFocusMap = new Map<string, FocusCategory>();
    for (const h of habits) {
      const normalized = normalizeCategory(h.category) as FocusCategory;
      habitFocusMap.set(h._id, normalized);
    }

    const buckets: FocusBucket[] = focus.map((f) => {
      const habitIds = new Set(
        habits.filter((h) => habitFocusMap.get(h._id) === f).map((h) => h._id),
      );
      const logs = habitLogs.filter((l) => habitIds.has(l.habitId));
      const activeDays = new Set(logs.map((l) => l.localDate)).size;
      return {
        focus: f,
        activeDays,
        logCount: logs.length,
        habitCount: habitIds.size,
        score: activeDays / 7,
      };
    });

    const allActiveDays = new Set(habitLogs.map((l) => l.localDate)).size;
    return { buckets, activeDays: allActiveDays };
  },
});

/**
 * Weekly review aggregation: focus-bucket performance + week-over-week
 * deltas + mood average + biggest positive/negative moves. Used by the
 * weekly review screen.
 */
export const weeklyReview = query({
  args: { offsetWeeks: v.optional(v.number()) },
  handler: async (ctx, { offsetWeeks = 0 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const focus = (user && 'focusCategories' in user
      ? (user.focusCategories as FocusCategory[] | undefined)
      : undefined) ?? [];

    const today = toLocalDate(Date.now());
    const thisWeekEnd = addDays(today, -7 * offsetWeeks);
    const thisWeekStart = addDays(thisWeekEnd, -6);
    const lastWeekEnd = addDays(thisWeekStart, -1);
    const lastWeekStart = addDays(lastWeekEnd, -6);

    const [habits, allLogs, moodLogs] = await Promise.all([
      ctx.db
        .query('habits')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db
        .query('habitLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', lastWeekStart).lte('localDate', thisWeekEnd),
        )
        .collect(),
      ctx.db
        .query('moodLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', lastWeekStart).lte('localDate', thisWeekEnd),
        )
        .collect(),
    ]);

    const habitFocusMap = new Map<string, FocusCategory>();
    for (const h of habits) {
      habitFocusMap.set(h._id, normalizeCategory(h.category) as FocusCategory);
    }

    const thisWeekLogs = allLogs.filter(
      (l) => l.localDate >= thisWeekStart && l.localDate <= thisWeekEnd,
    );
    const lastWeekLogs = allLogs.filter(
      (l) => l.localDate >= lastWeekStart && l.localDate <= lastWeekEnd,
    );

    function bucketsForRange(logs: typeof allLogs) {
      const out: Record<string, { activeDays: Set<string>; logCount: number }> = {};
      for (const f of focus) out[f] = { activeDays: new Set(), logCount: 0 };
      for (const log of logs) {
        const f = habitFocusMap.get(log.habitId);
        if (!f || !out[f]) continue;
        out[f].activeDays.add(log.localDate);
        out[f].logCount += 1;
      }
      return out;
    }

    const thisBuckets = bucketsForRange(thisWeekLogs);
    const lastBuckets = bucketsForRange(lastWeekLogs);

    const buckets = focus.map((f) => {
      const tActive = thisBuckets[f]?.activeDays.size ?? 0;
      const lActive = lastBuckets[f]?.activeDays.size ?? 0;
      return {
        focus: f,
        activeDays: tActive,
        lastWeekActiveDays: lActive,
        deltaDays: tActive - lActive,
        logCount: thisBuckets[f]?.logCount ?? 0,
      };
    });

    const thisMoods = moodLogs.filter(
      (m) => m.localDate >= thisWeekStart && m.localDate <= thisWeekEnd,
    );
    const lastMoods = moodLogs.filter(
      (m) => m.localDate >= lastWeekStart && m.localDate <= lastWeekEnd,
    );
    const avg = (xs: number[]) =>
      xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

    const avgMood = avg(thisMoods.map((m) => m.mood));
    const avgMoodLast = avg(lastMoods.map((m) => m.mood));
    const moodDelta = avgMood != null && avgMoodLast != null ? avgMood - avgMoodLast : null;

    const totalActiveDays = new Set(thisWeekLogs.map((l) => l.localDate)).size;

    return {
      weekStart: thisWeekStart,
      weekEnd: thisWeekEnd,
      buckets,
      totalActiveDays,
      moodEntries: thisMoods.length,
      avgMood,
      avgMoodLast,
      moodDelta,
    };
  },
});
