import { v } from 'convex/values';

import { internalMutation } from './_generated/server';

const CREW = [
  {
    username: 'kuba22',
    name: 'Kuba',
    level: 4,
    xp: 520,
    currentStreak: 12,
    longestStreak: 18,
  },
  {
    username: 'ola_g',
    name: 'Ola',
    level: 6,
    xp: 870,
    currentStreak: 7,
    longestStreak: 24,
  },
  {
    username: 'mikolajw',
    name: 'Mikołaj',
    level: 3,
    xp: 340,
    currentStreak: 3,
    longestStreak: 9,
  },
  {
    username: 'zosia_k',
    name: 'Zosia',
    level: 5,
    xp: 710,
    currentStreak: 21,
    longestStreak: 30,
  },
  {
    username: 'piotrekw',
    name: 'Piotrek',
    level: 2,
    xp: 180,
    currentStreak: 1,
    longestStreak: 5,
  },
];

export const seedCrewForUser = internalMutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const normalized = username.trim().toLowerCase();
    const target = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first();
    if (!target) {
      throw new Error(`User with username "${normalized}" not found`);
    }

    const now = Date.now();
    const createdUsers: string[] = [];
    const linkedFriendships: string[] = [];

    for (const member of CREW) {
      let friend = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', member.username))
        .first();

      if (!friend) {
        const id = await ctx.db.insert('users', {
          name: member.name,
          username: member.username,
          level: member.level,
          xp: member.xp,
          currentStreak: member.currentStreak,
          longestStreak: member.longestStreak,
          streakFreezeTokens: 0,
          joinedAt: now,
          onboardingCompletedAt: now,
          hideFromLeaderboards: false,
          isAnonymous: false,
          subscriptionTier: 'free',
        });
        friend = await ctx.db.get(id);
        if (!friend) continue;
        createdUsers.push(member.username);
      }

      const existingAB = await ctx.db
        .query('friendships')
        .withIndex('by_userA', (q) => q.eq('userAId', target._id))
        .filter((q) => q.eq(q.field('userBId'), friend!._id))
        .first();
      const existingBA = existingAB
        ? null
        : await ctx.db
            .query('friendships')
            .withIndex('by_userA', (q) => q.eq('userAId', friend!._id))
            .filter((q) => q.eq(q.field('userBId'), target._id))
            .first();

      if (existingAB || existingBA) {
        const existing = existingAB ?? existingBA!;
        if (existing.status !== 'active') {
          await ctx.db.patch(existing._id, {
            status: 'active',
            acceptedAt: now,
          });
        }
        continue;
      }

      const friendshipId = await ctx.db.insert('friendships', {
        userAId: target._id,
        userBId: friend._id,
        status: 'active',
        requestedAt: now,
        acceptedAt: now,
      });
      linkedFriendships.push(friendshipId);
    }

    return {
      targetUserId: target._id,
      createdUsers,
      linkedFriendships,
      totalCrewSize: CREW.length,
    };
  },
});
