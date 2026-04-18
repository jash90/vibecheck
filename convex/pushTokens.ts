import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const register = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
  },
  handler: async (ctx, { token, platform }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .take(1);

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, {
        userId,
        platform,
        lastSeenAt: Date.now(),
      });
    } else {
      await ctx.db.insert('pushTokens', {
        userId,
        token,
        platform,
        lastSeenAt: Date.now(),
      });
    }
  },
});

export const unregister = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const matches = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .collect();
    for (const m of matches) await ctx.db.delete(m._id);
  },
});

export const getMyPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const pref = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(1);
    return pref[0] ?? null;
  },
});

export const setMyPreferences = mutation({
  args: {
    dailyReminderEnabled: v.boolean(),
    reminderHour: v.number(),
    reminderMinute: v.number(),
    lowMoodAlertsEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (
      args.reminderHour < 0 ||
      args.reminderHour > 23 ||
      args.reminderMinute < 0 ||
      args.reminderMinute > 59
    ) {
      throw new ConvexError({ code: 'INVALID_TIME' });
    }

    const existing = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(1);

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('notificationPreferences', {
        userId,
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
