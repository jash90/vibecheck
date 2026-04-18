import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const CategoryValidator = v.union(
  v.literal('mental'),
  v.literal('physical'),
  v.literal('sleep'),
  v.literal('nutrition'),
  v.literal('mindfulness'),
  v.literal('hydration'),
  v.literal('mixed'),
);

const MAX_DURATION_DAYS = 30;
const MAX_TARGET_PER_PERSON = 60;

function computeStatus(now: number, start: number, end: number): 'upcoming' | 'active' | 'completed' {
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'active';
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const participations = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const challenges = await Promise.all(participations.map((p) => ctx.db.get(p.challengeId)));

    return participations
      .map((p, i) => {
        const c = challenges[i];
        if (!c) return null;
        return {
          ...c,
          myProgress: p.progress,
          joinedAt: p.joinedAt,
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  },
});

export const listActivePublic = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const upcomingOrActive = await ctx.db
      .query('challenges')
      .withIndex('by_status_and_end', (q) => q.gte('status', 'active'))
      .filter((q) => q.eq(q.field('isPublic'), true))
      .collect();
    return upcomingOrActive.filter((c) => c.endDate >= now);
  },
});

export const detail = query({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const challenge = await ctx.db.get(challengeId);
    if (!challenge) return null;

    const participants = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .collect();

    const users = await Promise.all(participants.map((p) => ctx.db.get(p.userId)));

    const userId = await getAuthUserId(ctx);
    const myParticipation = userId
      ? participants.find((p) => p.userId === userId) ?? null
      : null;

    return {
      ...challenge,
      participants: participants.map((p, i) => ({
        userId: p.userId,
        username: users[i]?.username ?? null,
        avatarUrl: users[i]?.avatarUrl ?? null,
        progress: p.progress,
        lastLogAt: p.lastLogAt,
      })),
      myProgress: myParticipation?.progress ?? 0,
      amIJoined: myParticipation !== null,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: CategoryValidator,
    durationDays: v.number(),
    targetPerPerson: v.number(),
    isPublic: v.boolean(),
    startsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (args.title.trim().length === 0 || args.title.length > 80) {
      throw new ConvexError({ code: 'INVALID_TITLE' });
    }
    if (args.description.length > 280) {
      throw new ConvexError({ code: 'INVALID_DESCRIPTION' });
    }
    if (args.durationDays < 1 || args.durationDays > MAX_DURATION_DAYS) {
      throw new ConvexError({ code: 'INVALID_DURATION' });
    }
    if (args.targetPerPerson < 1 || args.targetPerPerson > MAX_TARGET_PER_PERSON) {
      throw new ConvexError({ code: 'INVALID_TARGET' });
    }

    const now = Date.now();
    const startDate = args.startsAt ?? now;
    const endDate = startDate + args.durationDays * 24 * 60 * 60 * 1000;
    const xpReward = args.durationDays * 20;

    const challengeId = await ctx.db.insert('challenges', {
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      durationDays: args.durationDays,
      xpReward,
      targetPerPerson: args.targetPerPerson,
      startDate,
      endDate,
      creatorId: userId,
      isPublic: args.isPublic,
      status: computeStatus(now, startDate, endDate),
    });

    // Creator auto-joins
    await ctx.db.insert('challengeParticipants', {
      challengeId,
      userId,
      joinedAt: now,
      progress: 0,
    });

    return challengeId;
  },
});

export const join = mutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new ConvexError({ code: 'CHALLENGE_NOT_FOUND' });
    if (Date.now() > challenge.endDate) {
      throw new ConvexError({ code: 'CHALLENGE_ENDED' });
    }

    const existing = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .take(1);

    if (existing.length > 0) return;

    await ctx.db.insert('challengeParticipants', {
      challengeId,
      userId,
      joinedAt: Date.now(),
      progress: 0,
    });
  },
});

export const leave = mutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const existing = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .take(1);

    if (existing[0]) await ctx.db.delete(existing[0]._id);
  },
});

export const logProgress = mutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new ConvexError({ code: 'CHALLENGE_NOT_FOUND' });
    const now = Date.now();
    if (now < challenge.startDate || now > challenge.endDate) {
      throw new ConvexError({ code: 'NOT_ACTIVE' });
    }

    const existing = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .take(1);
    const participation = existing[0];
    if (!participation) throw new ConvexError({ code: 'NOT_JOINED' });

    const nextProgress = Math.min(participation.progress + 1, challenge.targetPerPerson);
    await ctx.db.patch(participation._id, { progress: nextProgress, lastLogAt: now });

    if (nextProgress >= challenge.targetPerPerson) {
      // Grant XP reward once on completion
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, { xp: user.xp + challenge.xpReward });
      }
    }
  },
});
