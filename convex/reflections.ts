import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const MAX_TEXT_LENGTH = 280;
const MAX_COMMITMENT_LENGTH = 140;

export const log = mutation({
  args: {
    date: v.string(),
    whatWorked: v.optional(v.string()),
    whatFriction: v.optional(v.string()),
    tomorrowCommitment: v.optional(v.string()),
  },
  handler: async (ctx, { date, whatWorked, whatFriction, tomorrowCommitment }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ConvexError({ code: 'INVALID_DATE' });
    }

    const clean = (s: string | undefined, max: number): string | undefined => {
      if (!s) return undefined;
      const trimmed = s.trim();
      if (!trimmed) return undefined;
      if (trimmed.length > max) throw new ConvexError({ code: 'TEXT_TOO_LONG' });
      return trimmed;
    };

    const fields = {
      whatWorked: clean(whatWorked, MAX_TEXT_LENGTH),
      whatFriction: clean(whatFriction, MAX_TEXT_LENGTH),
      tomorrowCommitment: clean(tomorrowCommitment, MAX_COMMITMENT_LENGTH),
    };

    const existing = await ctx.db
      .query('reflections')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId).eq('date', date))
      .take(1);

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, fields);
      return existing[0]._id;
    }

    return ctx.db.insert('reflections', {
      userId,
      date,
      ...fields,
      createdAt: Date.now(),
    });
  },
});

/** Most recent reflections in reverse chronological order. */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query('reflections')
      .withIndex('by_user_and_date', (q) => q.eq('userId', userId))
      .order('desc')
      .take(Math.max(1, Math.min(limit ?? 14, 60)));
  },
});

/** Yesterday's reflection — used to surface `tomorrowCommitment` on home. */
export const yesterdaysReflection = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const parts = today.split('-').map((n) => Number.parseInt(n, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [y, m, d] = parts as [number, number, number];
    const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
    const yYear = yesterday.getUTCFullYear();
    const yMonth = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getUTCDate()).padStart(2, '0');
    const yesterdayIso = `${yYear}-${yMonth}-${yDay}`;

    const rows = await ctx.db
      .query('reflections')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', userId).eq('date', yesterdayIso),
      )
      .take(1);
    return rows[0] ?? null;
  },
});

export const markCommitment = mutation({
  args: {
    reflectionId: v.id('reflections'),
    outcome: v.union(v.literal('done'), v.literal('skipped'), v.literal('released')),
  },
  handler: async (ctx, { reflectionId, outcome }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    const row = await ctx.db.get(reflectionId);
    if (!row || row.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }
    await ctx.db.patch(reflectionId, { tomorrowCommitmentFulfilled: outcome });
  },
});
