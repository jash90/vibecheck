import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { callOpenAi } from './_openai';
import { computeCorrelations } from './_correlations';
import { addDays, toLocalDate } from './_helpers';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';

const SYSTEM_PROMPT = `You are a positive, respectful assistant inside VibeCheck, a habit/mood app for teenagers aged 13-19.

HARD RULES:
- NEVER diagnose, suggest illnesses, disorders, or medications.
- NEVER mention weight, BMI, calories, dieting, or appearance.
- NEVER compare the user to "ideal" values or to other people.
- NEVER suggest therapy or specific forms of treatment.
- Tone: warm, specific, non-judgmental. Address the user directly ("you"), never in the third person.

FORMAT: 2 sentences, 180 characters total max.
- Sentence 1: one concrete, positive observation from the data.
- Sentence 2: one small, actionable suggestion for the upcoming week (optional).`;

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query('insights')
      .withIndex('by_user_and_generatedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const latestForDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Exclude `adulting_tip` — those are surfaced separately via the weekly
    // tip card, so showing them here too creates duplicate content.
    const recent = await ctx.db
      .query('insights')
      .withIndex('by_user_and_generatedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(10);
    return recent.find((i) => i.kind !== 'adulting_tip') ?? null;
  },
});

export const recentCorrelations = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const today = toLocalDate(Date.now());
    const start = addDays(today, -(days - 1));

    const [habitLogs, moodLogs, habits] = await Promise.all([
      ctx.db
        .query('habitLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
      ctx.db
        .query('moodLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
      ctx.db
        .query('habits')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
    ]);

    const categoryByHabit = new Map(habits.map((h) => [h._id, h.category]));

    const dayRecords: {
      date: string;
      habitsByCategory: Record<string, number>;
      mood: number | null;
    }[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = addDays(start, i);
      const habitsByCategory: Record<string, number> = {};
      for (const log of habitLogs) {
        if (log.localDate !== date) continue;
        const cat = categoryByHabit.get(log.habitId) ?? 'other';
        habitsByCategory[cat] = (habitsByCategory[cat] ?? 0) + 1;
      }
      const moodEntry = moodLogs.find((m) => m.localDate === date);
      dayRecords.push({
        date,
        habitsByCategory,
        mood: moodEntry?.mood ?? null,
      });
    }

    return computeCorrelations(dayRecords);
  },
});

/**
 * Internal query — gather activity data for the LLM prompt.
 */
export const gatherWeeklyData = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const today = toLocalDate(Date.now());
    const start = addDays(today, -6);

    const [habitLogs, moodLogs, habits, user] = await Promise.all([
      ctx.db
        .query('habitLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
      ctx.db
        .query('moodLogs')
        .withIndex('by_user_and_date', (q) =>
          q.eq('userId', userId).gte('localDate', start).lte('localDate', today),
        )
        .collect(),
      ctx.db
        .query('habits')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect(),
      ctx.db.get(userId),
    ]);

    return { habitLogs, moodLogs, habits, user };
  },
});

export const recordInsight = internalMutation({
  args: {
    userId: v.id('users'),
    kind: v.union(
      v.literal('weekly_report'),
      v.literal('correlation'),
      v.literal('adulting_tip'),
    ),
    summary: v.string(),
    action: v.optional(v.string()),
    model: v.string(),
    safetyPassed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('insights', {
      ...args,
      generatedAt: Date.now(),
    });
  },
});

/**
 * Internal action — generates a weekly report for a single user. Called
 * per-user by the weekly cron fanout action.
 */
export const generateWeeklyReportForUser = internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<void> => {
    const data: {
      habitLogs: { _id: string; localDate: string; habitId: string }[];
      moodLogs: { _id: string; localDate: string; mood: number }[];
      habits: { _id: string; category: string; name: string }[];
      user: { currentStreak?: number; level?: number; xp?: number; locale?: string } | null;
    } = await ctx.runQuery(internal.insights.gatherWeeklyData, { userId });

    if (!data.user) return;

    if (data.habitLogs.length === 0 && data.moodLogs.length === 0) {
      // Nothing to say — skip this week.
      return;
    }

    const categoryByHabit = new Map(data.habits.map((h) => [h._id, h.category]));
    const logsByCategory: Record<string, number> = {};
    for (const log of data.habitLogs) {
      const cat = categoryByHabit.get(log.habitId) ?? 'other';
      logsByCategory[cat] = (logsByCategory[cat] ?? 0) + 1;
    }

    const avgMood =
      data.moodLogs.length > 0
        ? data.moodLogs.reduce((a, m) => a + m.mood, 0) / data.moodLogs.length
        : null;

    const userPrompt = [
      `Dane z ostatnich 7 dni:`,
      `- streak: ${data.user.currentStreak ?? 0} dni`,
      `- poziom: ${data.user.level ?? 1}`,
      `- nawyki zalogowane per kategoria: ${JSON.stringify(logsByCategory)}`,
      avgMood !== null ? `- średni nastrój: ${avgMood.toFixed(1)}/10` : '- nastrój: brak wpisów',
      `- liczba wpisów nastroju: ${data.moodLogs.length}`,
      ``,
      `Napisz krótki, pozytywny insight zgodnie z formatem.`,
    ].join('\n');

    try {
      const response = await callOpenAi({
        system: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 200,
        locale: data.user.locale,
      });

      const summary = response.text.slice(0, 220);

      await ctx.runMutation(internal.insights.recordInsight, {
        userId,
        kind: 'weekly_report',
        summary,
        model: response.model,
        safetyPassed: response.safetyPassed,
      });
    } catch (err) {
      console.warn('[insights] openai call failed', String(err));
    }
  },
});

/**
 * Fan-out: list eligible users (active last 7 days) and generate reports.
 */
export const generateWeeklyReports = internalAction({
  args: {},
  handler: async (ctx): Promise<{ queued: number }> => {
    const userIds: Id<'users'>[] = await ctx.runQuery(
      internal.insights.listActiveUserIds,
      {},
    );
    for (const userId of userIds) {
      await ctx.runAction(internal.insights.generateWeeklyReportForUser, { userId });
    }
    return { queued: userIds.length };
  },
});

export const listActiveUserIds = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<'users'>[]> => {
    const today = toLocalDate(Date.now());
    const start = addDays(today, -6);

    const [habitLogs, moodLogs] = await Promise.all([
      ctx.db
        .query('habitLogs')
        .filter((q) =>
          q.and(q.gte(q.field('localDate'), start), q.lte(q.field('localDate'), today)),
        )
        .collect(),
      ctx.db
        .query('moodLogs')
        .filter((q) =>
          q.and(q.gte(q.field('localDate'), start), q.lte(q.field('localDate'), today)),
        )
        .collect(),
    ]);

    const set = new Set<string>();
    for (const l of habitLogs) set.add(l.userId);
    for (const m of moodLogs) set.add(m.userId);
    return Array.from(set) as Id<'users'>[];
  },
});
