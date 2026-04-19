import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { detectAndUnlockAchievements } from './achievements';
import { normalizeCategory } from './_focus';
import { toLocalDate } from './_helpers';
import { mutation, query } from './_generated/server';
import { addSkillXpFromHabit } from './lifeSkills';
import { awardXp, recomputeStreakForUser } from './streaks';

export const listForDate = query({
  args: { localDate: v.string() },
  handler: async (ctx, { localDate }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query('habitLogs')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).eq('localDate', localDate))
      .collect();
  },
});

export const logCompletion = mutation({
  args: {
    habitId: v.id('habits'),
    localDate: v.optional(v.string()),
    note: v.optional(v.string()),
    mood: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    value: v.optional(v.number()),
    timezoneOffsetMinutes: v.optional(v.number()),
    isMinimumVersion: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }

    const localDate = args.localDate ?? toLocalDate(Date.now(), args.timezoneOffsetMinutes ?? 0);

    const existing = await ctx.db
      .query('habitLogs')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).eq('localDate', localDate))
      .filter((q) => q.eq(q.field('habitId'), args.habitId))
      .take(1);

    if (existing.length > 0) {
      return {
        alreadyLogged: true as const,
        logId: existing[0]!._id,
        xp: null,
        identityCategory: habit.identityCategory ?? normalizeCategory(habit.category),
        isMinimumVersion: false,
      };
    }

    const isMinimum = args.isMinimumVersion === true;
    const logId = await ctx.db.insert('habitLogs', {
      userId,
      habitId: args.habitId,
      completedAt: Date.now(),
      localDate,
      note: args.note,
      mood: args.mood,
      durationMinutes: args.durationMinutes,
      value: args.value,
      isMinimumVersion: isMinimum ? true : undefined,
    });

    // Recompute streak first so XP multiplier reflects today's streak.
    await recomputeStreakForUser(ctx, userId);
    const xp = await awardXp(ctx, userId, isMinimum ? 'habit_minimum' : 'habit');
    await addSkillXpFromHabit(ctx, userId, habit.category);
    await detectAndUnlockAchievements(ctx, userId);
    return {
      alreadyLogged: false as const,
      logId,
      xp,
      identityCategory: habit.identityCategory ?? normalizeCategory(habit.category),
      isMinimumVersion: isMinimum,
    };
  },
});

export const unlog = mutation({
  args: { logId: v.id('habitLogs') },
  handler: async (ctx, { logId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const log = await ctx.db.get(logId);
    if (!log || log.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }

    await ctx.db.delete(logId);
    // No XP refund — streak recomputes, but XP stays as earned.
    await recomputeStreakForUser(ctx, userId);
  },
});
