import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { toLocalDate } from './_helpers';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

/**
 * 1:1 accountability partnerships. One active partner per user at a time.
 * Privacy contract: partner queries expose habit names + today's completion
 * state only. Never moods, reflections, identity statements, or notes.
 */

export const requestPartnership = mutation({
  args: { toUserId: v.id('users') },
  handler: async (ctx, { toUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (userId === toUserId) throw new ConvexError({ code: 'CANNOT_PARTNER_SELF' });

    const me = await ctx.db.get(userId);
    if (!me) throw new ConvexError({ code: 'USER_NOT_FOUND' });
    if (me.accountabilityPartnerId) {
      throw new ConvexError({ code: 'ALREADY_HAS_PARTNER' });
    }

    const them = await ctx.db.get(toUserId);
    if (!them) throw new ConvexError({ code: 'PARTNER_NOT_FOUND' });
    if (them.accountabilityPartnerId) {
      throw new ConvexError({ code: 'OTHER_HAS_PARTNER' });
    }

    const alreadyPending = await ctx.db
      .query('partnershipRequests')
      .withIndex('by_from', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(q.eq(q.field('toUserId'), toUserId), q.eq(q.field('status'), 'pending')),
      )
      .take(1);
    if (alreadyPending[0]) return alreadyPending[0]._id;

    return ctx.db.insert('partnershipRequests', {
      userId,
      toUserId,
      status: 'pending',
      requestedAt: Date.now(),
    });
  },
});

export const respondToRequest = mutation({
  args: {
    requestId: v.id('partnershipRequests'),
    accept: v.boolean(),
  },
  handler: async (ctx, { requestId, accept }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const req = await ctx.db.get(requestId);
    if (!req) throw new ConvexError({ code: 'NOT_FOUND' });
    if (req.toUserId !== userId) throw new ConvexError({ code: 'NOT_RECIPIENT' });
    if (req.status !== 'pending') {
      throw new ConvexError({ code: 'REQUEST_NOT_PENDING' });
    }

    const now = Date.now();

    if (!accept) {
      await ctx.db.patch(requestId, { status: 'declined', respondedAt: now });
      return { accepted: false as const };
    }

    const me = (await ctx.db.get(userId)) as Doc<'users'> | null;
    const them = (await ctx.db.get(req.userId)) as Doc<'users'> | null;
    if (!me || !them) throw new ConvexError({ code: 'USER_NOT_FOUND' });
    if (me.accountabilityPartnerId || them.accountabilityPartnerId) {
      throw new ConvexError({ code: 'ALREADY_HAS_PARTNER' });
    }

    await ctx.db.patch(userId, {
      accountabilityPartnerId: req.userId,
      partnershipStartedAt: now,
    });
    await ctx.db.patch(req.userId, {
      accountabilityPartnerId: userId,
      partnershipStartedAt: now,
    });
    await ctx.db.patch(requestId, { status: 'accepted', respondedAt: now });
    return { accepted: true as const };
  },
});

export const endPartnership = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const me = await ctx.db.get(userId);
    if (!me?.accountabilityPartnerId) return;

    const partnerId = me.accountabilityPartnerId;
    await ctx.db.patch(userId, {
      accountabilityPartnerId: undefined,
      partnershipStartedAt: undefined,
    });
    await ctx.db.patch(partnerId, {
      accountabilityPartnerId: undefined,
      partnershipStartedAt: undefined,
    });

    const active = await ctx.db
      .query('partnershipRequests')
      .withIndex('by_to_and_status', (q) =>
        q.eq('toUserId', userId).eq('status', 'accepted'),
      )
      .collect();
    for (const row of active) {
      if (row.userId === partnerId) {
        await ctx.db.patch(row._id, {
          status: 'ended',
          endedAt: Date.now(),
          endedByUserId: userId,
        });
      }
    }
    const mine = await ctx.db
      .query('partnershipRequests')
      .withIndex('by_from', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'accepted'))
      .collect();
    for (const row of mine) {
      if (row.toUserId === partnerId) {
        await ctx.db.patch(row._id, {
          status: 'ended',
          endedAt: Date.now(),
          endedByUserId: userId,
        });
      }
    }
  },
});

export const incomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const pending = await ctx.db
      .query('partnershipRequests')
      .withIndex('by_to_and_status', (q) =>
        q.eq('toUserId', userId).eq('status', 'pending'),
      )
      .collect();
    const requesters = await Promise.all(pending.map((r) => ctx.db.get(r.userId)));
    return pending.map((r, i) => ({
      requestId: r._id,
      requestedAt: r.requestedAt,
      from: requesters[i]
        ? { userId: r.userId, username: requesters[i]!.username ?? null }
        : null,
    }));
  },
});

/**
 * Partner dashboard view. Returns ONLY:
 * - partner's userId, username, current streak
 * - list of partner's active habit names
 * - completion flag per habit for the partner's local "today"
 *
 * Never returns mood, notes, identity statements, reflections, or bright spots.
 */
export const partnerView = query({
  args: { timezoneOffsetMinutes: v.optional(v.number()) },
  handler: async (ctx, { timezoneOffsetMinutes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const me = await ctx.db.get(userId);
    if (!me?.accountabilityPartnerId) return null;

    const partnerId = me.accountabilityPartnerId;
    const partner = await ctx.db.get(partnerId);
    if (!partner) return null;

    const habits = await ctx.db
      .query('habits')
      .withIndex('by_user', (q) => q.eq('userId', partnerId).eq('isActive', true))
      .collect();

    const today = toLocalDate(Date.now(), timezoneOffsetMinutes ?? 0);
    const logs = await ctx.db
      .query('habitLogs')
      .withIndex('by_user_and_date', (q) =>
        q.eq('userId', partnerId).eq('localDate', today),
      )
      .collect();
    const done = new Set(logs.map((l) => l.habitId));

    return {
      partnerId,
      username: partner.username ?? null,
      currentStreak: partner.currentStreak ?? 0,
      partnershipStartedAt: me.partnershipStartedAt ?? null,
      habits: habits.map((h) => ({
        habitId: h._id,
        name: h.name,
        done: done.has(h._id),
      })),
    };
  },
});
