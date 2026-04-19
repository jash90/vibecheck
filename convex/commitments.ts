import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const MAX_COMMITMENT_LENGTH = 160;

const SourceEventValidator = v.union(
  v.literal('monday'),
  v.literal('month'),
  v.literal('birthday'),
  v.literal('semester'),
  v.literal('manual'),
);

/**
 * Writes a Fresh Start commitment. `periodStart`/`periodEnd` come from the
 * client because the trigger-day window (Mon→Sun, 1st→end-of-month, etc.)
 * depends on the user's local timezone.
 */
export const log = mutation({
  args: {
    text: v.string(),
    sourceEvent: SourceEventValidator,
    periodStart: v.number(),
    periodEnd: v.number(),
    habitId: v.optional(v.id('habits')),
  },
  handler: async (ctx, { text, sourceEvent, periodStart, periodEnd, habitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_COMMITMENT_LENGTH) {
      throw new ConvexError({ code: 'INVALID_TEXT' });
    }
    if (periodEnd <= periodStart) {
      throw new ConvexError({ code: 'INVALID_PERIOD' });
    }

    const id = await ctx.db.insert('commitments', {
      userId,
      text: trimmed,
      sourceEvent,
      periodStart,
      periodEnd,
      habitId,
      fulfilled: undefined,
      createdAt: Date.now(),
    });

    await ctx.db.patch(userId, { lastFreshStartRitualAt: Date.now() });
    return id;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const now = Date.now();
    const all = await ctx.db
      .query('commitments')
      .withIndex('by_user_and_period', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
    return all.filter((c) => c.periodEnd >= now);
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query('commitments')
      .withIndex('by_user_and_period', (q) => q.eq('userId', userId))
      .order('desc')
      .take(Math.max(1, Math.min(limit ?? 20, 50)));
  },
});

export const markFulfilled = mutation({
  args: { commitmentId: v.id('commitments'), fulfilled: v.boolean() },
  handler: async (ctx, { commitmentId, fulfilled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const existing = await ctx.db.get(commitmentId);
    if (!existing || existing.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }
    await ctx.db.patch(commitmentId, { fulfilled });
  },
});
