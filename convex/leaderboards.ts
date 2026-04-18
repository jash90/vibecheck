import { getAuthUserId } from '@convex-dev/auth/server';

import { streakMultiplier } from './_helpers';
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
      score: Math.round(u.xp * streakMultiplier(u.currentStreak)),
      level: u.level,
      currentStreak: u.currentStreak,
      isMe: u._id === userId,
    }));

    entries.sort((a, b) => b.score - a.score);
    return entries;
  },
});
