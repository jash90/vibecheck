import { v } from 'convex/values';

import { addDays, toLocalDate } from './_helpers';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery } from './_generated/server';

const LOW_MOOD_THRESHOLD = 3;
const CONSECUTIVE_DAYS = 3;

/**
 * Internal query — called by the action. Returns user IDs whose last
 * `CONSECUTIVE_DAYS` mood logs are all ≤ `LOW_MOOD_THRESHOLD`.
 */
export const findLowMoodUsers = internalQuery({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const today = toLocalDate(Date.now());
    const start = addDays(today, -(CONSECUTIVE_DAYS - 1));

    const moodLogs = await ctx.db
      .query('moodLogs')
      .filter((q) =>
        q.and(q.gte(q.field('localDate'), start), q.lte(q.field('localDate'), today)),
      )
      .collect();

    const byUser = new Map<string, number[]>();
    for (const log of moodLogs) {
      const bucket = byUser.get(log.userId) ?? [];
      bucket.push(log.mood);
      byUser.set(log.userId, bucket);
    }

    const flagged: string[] = [];
    for (const [userId, moods] of byUser) {
      if (moods.length < CONSECUTIVE_DAYS) continue;
      if (moods.every((m) => m <= LOW_MOOD_THRESHOLD)) {
        flagged.push(userId);
      }
    }
    return flagged;
  },
});

/**
 * Internal action — scheduled daily by crons. Calls the query and kicks off
 * push-notification sends (Phase 1 stubs the notification send; wires in
 * Phase 3 alongside Expo push tokens).
 */
export const detectLowMoodUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const flaggedIds: string[] = await ctx.runQuery(internal.safety.findLowMoodUsers, {});
    for (const userId of flaggedIds) {
      await ctx.runMutation(internal.safety.recordLowMoodCheckIn, { userId });
    }
    return { flagged: flaggedIds.length };
  },
});

/**
 * Internal mutation — records that we've sent a low-mood check-in for a user.
 * Phase 3 will add `lowMoodNotificationsSentAt` tracking to rate-limit so we
 * don't spam the user every day. For Phase 1 this is a no-op placeholder.
 */
export const recordLowMoodCheckIn = internalMutation({
  args: { userId: v.string() },
  handler: async (_ctx, _args) => {
    // Placeholder — no-op for Phase 1. See comment above.
  },
});
