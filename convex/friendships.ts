import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { type QueryCtx, mutation, query } from './_generated/server';

async function resolveUserByUsername(ctx: QueryCtx, username: string) {
  const matches = await ctx.db
    .query('users')
    .withIndex('by_username', (q) => q.eq('username', username))
    .take(1);
  return matches[0] ?? null;
}

export const findByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return null;
    const match = await resolveUserByUsername(ctx, trimmed);
    if (!match) return null;
    return {
      _id: match._id,
      username: match.username,
      avatarUrl: match.avatarUrl,
      level: match.level,
    };
  },
});

export const listMyFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const [asA, asB] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_userA', (q) => q.eq('userAId', userId).eq('status', 'active'))
        .collect(),
      ctx.db
        .query('friendships')
        .withIndex('by_userB', (q) => q.eq('userBId', userId).eq('status', 'active'))
        .collect(),
    ]);

    const friendIds = [
      ...asA.map((f) => f.userBId),
      ...asB.map((f) => f.userAId),
    ];
    const friends = await Promise.all(friendIds.map((id) => ctx.db.get(id)));
    return friends
      .filter((f): f is NonNullable<typeof f> => Boolean(f))
      .map((f) => ({
        _id: f._id,
        username: f.username,
        avatarUrl: f.avatarUrl,
        level: f.level,
        xp: f.xp,
        currentStreak: f.currentStreak,
        hideFromLeaderboards: f.hideFromLeaderboards,
      }));
  },
});

export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const pending = await ctx.db
      .query('friendships')
      .withIndex('by_userB', (q) => q.eq('userBId', userId).eq('status', 'pending'))
      .collect();

    const requesters = await Promise.all(pending.map((p) => ctx.db.get(p.userAId)));
    return pending.map((p, i) => ({
      requestId: p._id,
      requestedAt: p.requestedAt,
      from: requesters[i]
        ? {
            _id: requesters[i]!._id,
            username: requesters[i]!.username,
            avatarUrl: requesters[i]!.avatarUrl,
          }
        : null,
    }));
  },
});

export const sendRequest = mutation({
  args: { toUserId: v.id('users') },
  handler: async (ctx, { toUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    if (toUserId === userId) throw new ConvexError({ code: 'CANNOT_FRIEND_SELF' });

    const target = await ctx.db.get(toUserId);
    if (!target) throw new ConvexError({ code: 'USER_NOT_FOUND' });

    const existing = await existingFriendship(ctx, userId, toUserId);
    if (existing) {
      throw new ConvexError({ code: 'ALREADY_EXISTS', message: existing.status });
    }

    await ctx.db.insert('friendships', {
      userAId: userId,
      userBId: toUserId,
      status: 'pending',
      requestedAt: Date.now(),
    });
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id('friendships') },
  handler: async (ctx, { requestId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const req = await ctx.db.get(requestId);
    if (!req || req.userBId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }
    if (req.status !== 'pending') {
      throw new ConvexError({ code: 'NOT_PENDING' });
    }

    await ctx.db.patch(requestId, { status: 'active', acceptedAt: Date.now() });
  },
});

export const removeFriend = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const existing = await existingFriendship(ctx, userId, otherUserId);
    if (!existing) return;
    await ctx.db.delete(existing._id);
  },
});

async function existingFriendship(ctx: QueryCtx, a: Id<'users'>, b: Id<'users'>) {
  const [aToB, bToA] = await Promise.all([
    ctx.db
      .query('friendships')
      .withIndex('by_userA', (q) => q.eq('userAId', a))
      .filter((q) => q.eq(q.field('userBId'), b))
      .take(1),
    ctx.db
      .query('friendships')
      .withIndex('by_userA', (q) => q.eq('userAId', b))
      .filter((q) => q.eq(q.field('userBId'), a))
      .take(1),
  ]);
  return aToB[0] ?? bToA[0] ?? null;
}
