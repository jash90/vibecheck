import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const MAX_REASON_LENGTH = 280;

/** Write or upsert this week's bright spot. `weekStart` = YYYY-MM-DD of Monday. */
export const log = mutation({
  args: {
    weekStart: v.string(),
    bestDayDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { weekStart, bestDayDate, reason }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || !/^\d{4}-\d{2}-\d{2}$/.test(bestDayDate)) {
      throw new ConvexError({ code: 'INVALID_DATE' });
    }
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > MAX_REASON_LENGTH) {
      throw new ConvexError({ code: 'INVALID_REASON' });
    }

    const existing = await ctx.db
      .query('brightSpots')
      .withIndex('by_user_and_weekStart', (q) =>
        q.eq('userId', userId).eq('weekStart', weekStart),
      )
      .take(1);

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, { bestDayDate, reason: trimmed });
      return existing[0]._id;
    }

    return ctx.db.insert('brightSpots', {
      userId,
      weekStart,
      bestDayDate,
      reason: trimmed,
      createdAt: Date.now(),
    });
  },
});

export const thisWeek = query({
  args: { weekStart: v.string() },
  handler: async (ctx, { weekStart }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const rows = await ctx.db
      .query('brightSpots')
      .withIndex('by_user_and_weekStart', (q) =>
        q.eq('userId', userId).eq('weekStart', weekStart),
      )
      .take(1);
    return rows[0] ?? null;
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query('brightSpots')
      .withIndex('by_user_and_weekStart', (q) => q.eq('userId', userId))
      .order('desc')
      .take(Math.max(1, Math.min(limit ?? 8, 20)));
  },
});
