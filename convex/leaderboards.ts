import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { addDays, streakMultiplier, toLocalDate } from './_helpers';
import { query } from './_generated/server';

interface LeaderboardEntry {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
  level: number;
  currentStreak: number;
  isMe: boolean;
}

export const friendLeaderboard = query({
  args: {},
  handler: async (ctx): Promise<LeaderboardEntry[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const me = await ctx.db.get(userId);
    if (!me) return [];

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

    const friendIds = [...asA.map((f) => f.userBId), ...asB.map((f) => f.userAId)];
    const friends = (
      await Promise.all(friendIds.map((id) => ctx.db.get(id)))
    ).filter((u): u is NonNullable<typeof u> => Boolean(u));

    const visible = [me, ...friends].filter((u) => !u.hideFromLeaderboards);

    const entries: LeaderboardEntry[] = visible.map((u) => ({
      userId: u._id,
      username: u.username ?? u.name ?? null,
      avatarUrl: u.avatarUrl ?? u.image ?? null,
      score: Math.round((u.xp ?? 0) * streakMultiplier(u.currentStreak ?? 0)),
      level: u.level ?? 1,
      currentStreak: u.currentStreak ?? 0,
      isMe: u._id === userId,
    }));

    entries.sort((a, b) => b.score - a.score);
    return entries;
  },
});

/**
 * Weekly leaderboard for a specific habit category. Ranks friends + self by
 * the number of habit completions in that category in the last 7 days.
 */
export const categoryLeaderboard = query({
  args: {
    category: v.union(
      v.literal('mental'),
      v.literal('physical'),
      v.literal('sleep'),
      v.literal('nutrition'),
      v.literal('mindfulness'),
      v.literal('hydration'),
    ),
  },
  handler: async (ctx, { category }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [] as LeaderboardEntry[];

    const me = await ctx.db.get(userId);
    if (!me) return [] as LeaderboardEntry[];

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

    const friendIds = [...asA.map((f) => f.userBId), ...asB.map((f) => f.userAId)];
    const friendDocs = (await Promise.all(friendIds.map((id) => ctx.db.get(id)))).filter(
      (u): u is NonNullable<typeof u> => Boolean(u),
    );
    const people = [me, ...friendDocs].filter((p) => !p.hideFromLeaderboards);

    const today = toLocalDate(Date.now());
    const start = addDays(today, -6);

    const allHabits = await Promise.all(
      people.map((p) =>
        ctx.db
          .query('habits')
          .withIndex('by_user', (q) => q.eq('userId', p._id))
          .filter((q) => q.eq(q.field('category'), category))
          .collect(),
      ),
    );

    const entries: LeaderboardEntry[] = await Promise.all(
      people.map(async (person, idx) => {
        const habitIds = new Set(allHabits[idx]?.map((h) => h._id));
        if (habitIds.size === 0) {
          return {
            userId: person._id,
            username: person.username ?? person.name ?? null,
            avatarUrl: person.avatarUrl ?? person.image ?? null,
            score: 0,
            level: person.level ?? 1,
            currentStreak: person.currentStreak ?? 0,
            isMe: person._id === userId,
          };
        }
        const logs = await ctx.db
          .query('habitLogs')
          .withIndex('by_user_and_date', (q) =>
            q.eq('userId', person._id).gte('localDate', start).lte('localDate', today),
          )
          .collect();
        const count = logs.filter((l) => habitIds.has(l.habitId)).length;
        return {
          userId: person._id,
          username: person.username ?? person.name ?? null,
          avatarUrl: person.avatarUrl ?? person.image ?? null,
          score: count,
          level: person.level ?? 1,
          currentStreak: person.currentStreak ?? 0,
          isMe: person._id === userId,
        };
      }),
    );

    entries.sort((a, b) => b.score - a.score);
    return entries;
  },
});
