import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { addDays, toLocalDate } from './_helpers';
import { mutation, query } from './_generated/server';
import { awardXp, recomputeStreakForUser } from './streaks';

export const todayForMe = query({
  args: { timezoneOffsetMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const localDate = toLocalDate(Date.now(), args.timezoneOffsetMinutes ?? 0);
    const logs = await ctx.db
      .query('moodLogs')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).eq('localDate', localDate))
      .collect();
    return logs[0] ?? null;
  },
});

export const recentForMe = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const today = toLocalDate(Date.now());
    const start = addDays(today, -(days - 1));
    return ctx.db
      .query('moodLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
      )
      .collect();
  },
});

export const log = mutation({
  args: {
    mood: v.number(),
    emotions: v.array(v.string()),
    note: v.optional(v.string()),
    timezoneOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (args.mood < 1 || args.mood > 10) {
      throw new ConvexError({ code: 'INVALID_MOOD' });
    }
    if (args.emotions.length > 10) {
      throw new ConvexError({ code: 'TOO_MANY_EMOTIONS' });
    }

    const localDate = toLocalDate(Date.now(), args.timezoneOffsetMinutes ?? 0);

    const existing = await ctx.db
      .query('moodLogs')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).eq('localDate', localDate))
      .take(1);

    const logId = existing[0]?._id;
    const isNewLog = !logId;

    if (logId) {
      await ctx.db.patch(logId, {
        mood: args.mood,
        emotions: args.emotions,
        note: args.note,
        loggedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('moodLogs', {
        userId,
        mood: args.mood,
        emotions: args.emotions,
        note: args.note,
        loggedAt: Date.now(),
        localDate,
      });
    }

    await recomputeStreakForUser(ctx, userId);
    if (isNewLog) {
      // Only award XP once per day — editing today's entry doesn't double-pay.
      await awardXp(ctx, userId, 'mood');
    }
  },
});
