import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { toLocalDate } from './_helpers';
import { mutation, query } from './_generated/server';

/**
 * Duhigg bad-habit dismantling — "cue / routine / reward" mapper with
 * reward-substitution. No XP, no public leaderboards, no exposure to
 * partners or friends. Awareness tool; not reward work.
 */

const RewardTypeValidator = v.union(
  v.literal('stimulation'),
  v.literal('escape'),
  v.literal('comfort'),
  v.literal('connection'),
  v.literal('control'),
  v.literal('other'),
);

const OutcomeValidator = v.union(
  v.literal('did_original'),
  v.literal('did_substitute'),
  v.literal('resisted_without_sub'),
  v.literal('not_triggered'),
);

const MAX_NAME = 80;
const MAX_TEXT = 280;
const MAX_CUE_FIELD = 80;

export const create = mutation({
  args: {
    name: v.string(),
    cueTime: v.optional(v.string()),
    cueLocation: v.optional(v.string()),
    cueEmotion: v.optional(v.string()),
    cueTrigger: v.optional(v.string()),
    rewardType: RewardTypeValidator,
    rewardDescription: v.string(),
    substituteTexts: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const name = args.name.trim();
    if (!name || name.length > MAX_NAME) {
      throw new ConvexError({ code: 'INVALID_NAME' });
    }
    const rewardDescription = args.rewardDescription.trim();
    if (!rewardDescription || rewardDescription.length > MAX_TEXT) {
      throw new ConvexError({ code: 'INVALID_REWARD_DESCRIPTION' });
    }
    const cleanCueField = (val: string | undefined): string | undefined => {
      if (!val) return undefined;
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      if (trimmed.length > MAX_CUE_FIELD) {
        throw new ConvexError({ code: 'INVALID_CUE_FIELD' });
      }
      return trimmed;
    };
    const substituteTexts = (args.substituteTexts ?? [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= MAX_TEXT)
      .slice(0, 5);

    return ctx.db.insert('badHabits', {
      userId,
      name,
      cueTime: cleanCueField(args.cueTime),
      cueLocation: cleanCueField(args.cueLocation),
      cueEmotion: cleanCueField(args.cueEmotion),
      cueTrigger: cleanCueField(args.cueTrigger),
      rewardType: args.rewardType,
      rewardDescription,
      substituteTexts: substituteTexts.length > 0 ? substituteTexts : undefined,
      createdAt: Date.now(),
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('badHabits')
      .withIndex('by_user_and_endedAt', (q) => q.eq('userId', userId))
      .collect();
    return rows.filter((r) => !r.endedAt);
  },
});

export const detail = query({
  args: { badHabitId: v.id('badHabits') },
  handler: async (ctx, { badHabitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db.get(badHabitId);
    if (!row || row.userId !== userId) return null;

    const logs = await ctx.db
      .query('badHabitLogs')
      .withIndex('by_badHabit_and_date', (q) => q.eq('badHabitId', badHabitId))
      .order('desc')
      .take(28);
    return { ...row, logs };
  },
});

export const log = mutation({
  args: {
    badHabitId: v.id('badHabits'),
    date: v.string(),
    outcome: OutcomeValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, { badHabitId, date, outcome, note }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const parent = await ctx.db.get(badHabitId);
    if (!parent || parent.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ConvexError({ code: 'INVALID_DATE' });
    }
    const cleanNote = note?.trim();
    if (cleanNote && cleanNote.length > MAX_TEXT) {
      throw new ConvexError({ code: 'INVALID_NOTE' });
    }

    const existing = await ctx.db
      .query('badHabitLogs')
      .withIndex('by_badHabit_and_date', (q) =>
        q.eq('badHabitId', badHabitId).eq('date', date),
      )
      .take(1);

    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, { outcome, note: cleanNote });
      return existing[0]._id;
    }

    return ctx.db.insert('badHabitLogs', {
      userId,
      badHabitId,
      date,
      outcome,
      note: cleanNote,
      createdAt: Date.now(),
    });
  },
});

export const endBadHabit = mutation({
  args: { badHabitId: v.id('badHabits') },
  handler: async (ctx, { badHabitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const row = await ctx.db.get(badHabitId);
    if (!row || row.userId !== userId) throw new ConvexError({ code: 'NOT_FOUND' });
    await ctx.db.patch(badHabitId, { endedAt: Date.now() });
  },
});

/**
 * Weekly summary: counts each outcome for the last `days` days (default 7).
 * Used by a future weekly-review integration; kept private to the user.
 */
export const weeklyBreakdown = query({
  args: {
    badHabitId: v.id('badHabits'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { badHabitId, days }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db.get(badHabitId);
    if (!row || row.userId !== userId) return null;

    const window = Math.max(1, Math.min(days ?? 7, 28));
    const cutoffDate = toLocalDate(Date.now() - window * 24 * 60 * 60 * 1000);
    const logs = await ctx.db
      .query('badHabitLogs')
      .withIndex('by_badHabit_and_date', (q) => q.eq('badHabitId', badHabitId))
      .collect();

    const recent = logs.filter((l) => l.date >= cutoffDate);
    const byOutcome: Record<string, number> = {
      did_original: 0,
      did_substitute: 0,
      resisted_without_sub: 0,
      not_triggered: 0,
    };
    for (const log of recent) {
      byOutcome[log.outcome] = (byOutcome[log.outcome] ?? 0) + 1;
    }
    return { window, total: recent.length, byOutcome };
  },
});
