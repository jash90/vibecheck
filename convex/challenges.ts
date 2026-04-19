import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { levelForXp, toLocalDate } from './_helpers';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';

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
          myLastLogDate: p.lastLogDate ?? null,
          joinedAt: p.joinedAt,
          myAwardedXp: p.awardedXp ?? null,
          myFinalRank: p.finalRank ?? null,
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
        awardedXp: p.awardedXp ?? null,
        finalRank: p.finalRank ?? null,
      })),
      myProgress: myParticipation?.progress ?? 0,
      myLastLogDate: myParticipation?.lastLogDate ?? null,
      myAwardedXp: myParticipation?.awardedXp ?? null,
      myFinalRank: myParticipation?.finalRank ?? null,
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
    // Kept for back-compat on the challenge document; actual prize amounts are
    // now derived at finalize time from group-size + rank (see computeChallengePrizes).
    const xpReward = 15;

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

    await ctx.scheduler.runAt(endDate, internal.challenges.finalize, { challengeId });

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

export const markConvertedToHabit = mutation({
  args: {
    challengeId: v.id('challenges'),
    habitId: v.id('habits'),
  },
  handler: async (ctx, { challengeId, habitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const challenge = await ctx.db.get(challengeId);
    if (!challenge) throw new ConvexError({ code: 'CHALLENGE_NOT_FOUND' });

    const participation = await ctx.db
      .query('challengeParticipants')
      .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .take(1);
    if (participation.length === 0) {
      throw new ConvexError({ code: 'NOT_JOINED' });
    }

    const habit = await ctx.db.get(habitId);
    if (!habit || habit.userId !== userId) {
      throw new ConvexError({ code: 'HABIT_NOT_FOUND' });
    }

    await ctx.db.patch(challengeId, { convertedToHabitId: habitId });
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
  args: {
    challengeId: v.id('challenges'),
    timezoneOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { challengeId, timezoneOffsetMinutes }) => {
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

    const today = toLocalDate(now, timezoneOffsetMinutes ?? 0);
    if (participation.lastLogDate === today) {
      return {
        alreadyLoggedToday: true as const,
        progress: participation.progress,
        justCompleted: false as const,
      };
    }

    const nextProgress = Math.min(participation.progress + 1, challenge.targetPerPerson);
    await ctx.db.patch(participation._id, {
      progress: nextProgress,
      lastLogAt: now,
      lastLogDate: today,
    });

    const justCompleted =
      participation.progress < challenge.targetPerPerson &&
      nextProgress >= challenge.targetPerPerson;

    return {
      alreadyLoggedToday: false as const,
      progress: nextProgress,
      justCompleted,
    };
  },
});

type RankableParticipant = Pick<
  Doc<'challengeParticipants'>,
  '_id' | 'userId' | 'progress'
>;

interface PrizeAward {
  participantId: Id<'challengeParticipants'>;
  userId: Id<'users'>;
  xp: number;
  rank: number;
}

/**
 * Pure prize allocator. Rules:
 * - Zero completers → no awards, no ranks.
 * - N=1: the only completer gets 5.
 * - N=2: both complete → tied rank 1, 10 each. Only 1 completes → completer gets 12.
 * - N≥3: dense-rank by `progress` desc across all with `progress > 0`; top 3 ranks
 *   get 15 / 10 / 7. Ties share the prize; next distinct progress advances rank by 1.
 */
export function computeChallengePrizes(
  parts: readonly RankableParticipant[],
  target: number,
): PrizeAward[] {
  const ranked = parts.filter((p) => p.progress > 0);
  const completers = ranked.filter((p) => p.progress >= target);
  if (completers.length === 0) return [];

  const totalParticipants = parts.length;

  if (totalParticipants === 1) {
    const c = completers[0]!;
    return [{ participantId: c._id, userId: c.userId, xp: 5, rank: 1 }];
  }

  if (totalParticipants === 2) {
    if (completers.length === 2) {
      return completers.map((c) => ({
        participantId: c._id,
        userId: c.userId,
        xp: 10,
        rank: 1,
      }));
    }
    const c = completers[0]!;
    return [{ participantId: c._id, userId: c.userId, xp: 12, rank: 1 }];
  }

  const prizeByRank = [15, 10, 7];
  const sorted = [...ranked].sort((a, b) => b.progress - a.progress);
  const out: PrizeAward[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    if (i > 0 && p.progress !== sorted[i - 1]!.progress) rank++;
    if (rank > 3) break;
    out.push({
      participantId: p._id,
      userId: p.userId,
      xp: prizeByRank[rank - 1]!,
      rank,
    });
  }
  return out;
}

async function creditChallengeXp(
  ctx: MutationCtx,
  userId: Id<'users'>,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const user = await ctx.db.get(userId);
  if (!user) return;
  const nextXp = (user.xp ?? 0) + amount;
  const nextLevel = levelForXp(nextXp);
  await ctx.db.patch(userId, { xp: nextXp, level: nextLevel });
}

async function finalizeChallenge(
  ctx: MutationCtx,
  challengeId: Id<'challenges'>,
): Promise<void> {
  const challenge = await ctx.db.get(challengeId);
  if (!challenge) return;
  if (challenge.finalizedAt !== undefined) return;
  if (Date.now() < challenge.endDate) return;

  const participants = await ctx.db
    .query('challengeParticipants')
    .withIndex('by_challenge', (q) => q.eq('challengeId', challengeId))
    .collect();

  const awards = computeChallengePrizes(participants, challenge.targetPerPerson);
  const awardsByParticipant = new Map(awards.map((a) => [a.participantId, a]));

  for (const p of participants) {
    const award = awardsByParticipant.get(p._id);
    if (award) {
      await ctx.db.patch(p._id, {
        awardedXp: award.xp,
        finalRank: award.rank,
      });
      await creditChallengeXp(ctx, award.userId, award.xp);
    } else if (p.awardedXp === undefined) {
      await ctx.db.patch(p._id, { awardedXp: 0 });
    }
  }

  await ctx.db.patch(challengeId, { finalizedAt: Date.now() });
}

export const finalize = internalMutation({
  args: { challengeId: v.id('challenges') },
  handler: async (ctx, { challengeId }) => {
    await finalizeChallenge(ctx, challengeId);
  },
});

/**
 * One-off migration. Run via:
 *   npx convex run challenges:backfillFinalize
 * Legacy challenges already past endDate are marked finalized WITHOUT awarding
 * XP — the old buggy logProgress already credited (often overcredited) users,
 * so we don't double-pay. In-flight challenges get a fresh scheduler entry.
 */
export const backfillFinalize = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query('challenges').collect();
    for (const c of all) {
      if (c.finalizedAt !== undefined) continue;
      if (c.endDate <= now) {
        const participants = await ctx.db
          .query('challengeParticipants')
          .withIndex('by_challenge', (q) => q.eq('challengeId', c._id))
          .collect();
        for (const p of participants) {
          if (p.awardedXp === undefined) {
            await ctx.db.patch(p._id, { awardedXp: 0 });
          }
        }
        await ctx.db.patch(c._id, { finalizedAt: now });
      } else {
        await ctx.scheduler.runAt(c.endDate, internal.challenges.finalize, {
          challengeId: c._id,
        });
      }
    }
  },
});
