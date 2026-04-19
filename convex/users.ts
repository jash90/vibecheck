import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const MIN_AGE = 13;
const PARENT_CONSENT_AGE = 16;

type FocusCategory = 'sleep' | 'movement' | 'hydration' | 'mood' | 'mindfulness' | 'nutrition';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      username: user.username,
      avatarUrl: user.avatarUrl,
      birthYear: user.birthYear,
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      streakFreezeTokens: user.streakFreezeTokens ?? 0,
      onboardingCompletedAt: user.onboardingCompletedAt,
      parentApproved: user.parentApproved ?? false,
      parentEmail: user.parentEmail,
      focusCategories: user.focusCategories,
      locale: user.locale ?? null,
      hideFromLeaderboards: user.hideFromLeaderboards ?? false,
      tendency: user.tendency ?? null,
      identityStatements: user.identityStatements ?? null,
      zenMode: user.zenMode ?? false,
      streakPausedUntil: user.streakPausedUntil ?? null,
      streakPausedFrom: user.streakPausedFrom ?? null,
      streakPauseReason: user.streakPauseReason ?? null,
      environmentExperiments: user.environmentExperiments ?? [],
      freshStartOptIn: user.freshStartOptIn ?? true,
      schoolSemesterDates: user.schoolSemesterDates ?? [],
      lastFreshStartRitualAt: user.lastFreshStartRitualAt ?? null,
      reflectionEnabled: user.reflectionEnabled ?? false,
      reflectionTime: user.reflectionTime ?? null,
      accountabilityPartnerId: user.accountabilityPartnerId ?? null,
      partnershipStartedAt: user.partnershipStartedAt ?? null,
    };
  },
});

export const setLocale = mutation({
  args: { locale: v.string() },
  handler: async (ctx, { locale }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const normalized = locale.slice(0, 5).toLowerCase();
    await ctx.db.patch(userId, { locale: normalized });
  },
});

export const onboardingState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { step: 'signed-out' as const };
    const user = await ctx.db.get(userId);
    if (!user) return { step: 'signed-out' as const };

    if (!user.birthYear) return { step: 'age-gate' as const };

    const age = new Date().getFullYear() - user.birthYear;
    if (age < MIN_AGE) return { step: 'blocked' as const };

    if (age < PARENT_CONSENT_AGE && !user.parentApproved) {
      if (!user.parentEmail) return { step: 'parent-consent' as const };
      return { step: 'awaiting-parent-approval' as const, parentEmail: user.parentEmail };
    }

    if (!user.focusCategories || user.focusCategories.length === 0) {
      return { step: 'focus-picker' as const };
    }

    const identityComplete = user.focusCategories.every(
      (cat) => !!user.identityStatements?.[cat],
    );
    if (!identityComplete) return { step: 'identity-picker' as const };

    if (!user.tendency) return { step: 'tendency-quiz' as const };

    if (!user.onboardingCompletedAt) return { step: 'goal-setup' as const };

    return { step: 'ready' as const };
  },
});

export const setBirthYear = mutation({
  args: { birthYear: v.number() },
  handler: async (ctx, { birthYear }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const currentYear = new Date().getFullYear();
    if (birthYear < 1900 || birthYear > currentYear) {
      throw new ConvexError({ code: 'INVALID_BIRTH_YEAR' });
    }

    const age = currentYear - birthYear;
    if (age < MIN_AGE) {
      await ctx.db.patch(userId, {
        birthYear,
        parentApproved: false,
      });
      throw new ConvexError({ code: 'UNDERAGE_BLOCKED', message: 'Minimalny wiek to 13 lat.' });
    }

    const patchData: {
      birthYear: number;
      parentApproved: boolean;
      level?: number;
      xp?: number;
      currentStreak?: number;
      longestStreak?: number;
      streakFreezeTokens?: number;
      joinedAt?: number;
      hideFromLeaderboards?: boolean;
    } = {
      birthYear,
      parentApproved: age >= PARENT_CONSENT_AGE,
    };

    const existing = await ctx.db.get(userId);
    if (existing && existing.level === undefined) {
      patchData.level = 1;
      patchData.xp = 0;
      patchData.currentStreak = 0;
      patchData.longestStreak = 0;
      patchData.streakFreezeTokens = 0;
      patchData.joinedAt = Date.now();
      patchData.hideFromLeaderboards = false;
    }

    await ctx.db.patch(userId, patchData);
    return { requiresParentConsent: age < PARENT_CONSENT_AGE };
  },
});

export const setParentEmail = mutation({
  args: { parentEmail: v.string() },
  handler: async (ctx, { parentEmail }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      throw new ConvexError({ code: 'INVALID_EMAIL' });
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.birthYear) {
      throw new ConvexError({ code: 'AGE_NOT_SET' });
    }

    const age = new Date().getFullYear() - user.birthYear;
    if (age >= PARENT_CONSENT_AGE) {
      return { skipped: true as const };
    }

    const token = crypto.randomUUID();
    const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Dev-only auto-approve: skip the parent email round-trip in development so
    // the onboarding flow is testable end-to-end without a live inbox. In
    // production deployments the user must wait for the real email approval.
    const isDevDeployment = process.env.DEV_AUTO_APPROVE === '1';

    await ctx.db.patch(userId, {
      parentEmail,
      parentApproved: isDevDeployment,
      parentApprovalRequestedAt: Date.now(),
      parentApprovalToken: isDevDeployment ? undefined : token,
      parentApprovalTokenExpiresAt: isDevDeployment ? undefined : expires,
    });

    return {
      skipped: false as const,
      autoApproved: isDevDeployment,
      token: isDevDeployment ? null : token,
    };
  },
});

/**
 * Dev-only: auto-approve the current user's parent consent. No-op in prod
 * deployments. Lets the awaiting-parent screen unblock itself automatically
 * during local development and simulator testing.
 */
export const devAutoApprove = mutation({
  args: {},
  handler: async (ctx) => {
    const isDevDeployment = process.env.DEV_AUTO_APPROVE === '1';
    if (!isDevDeployment) return { approved: false as const };

    const userId = await getAuthUserId(ctx);
    if (!userId) return { approved: false as const };

    const user = await ctx.db.get(userId);
    if (!user || user.parentApproved) return { approved: true as const };

    await ctx.db.patch(userId, {
      parentApproved: true,
      parentApprovalToken: undefined,
      parentApprovalTokenExpiresAt: undefined,
    });
    return { approved: true as const };
  },
});

export const approveParentConsent = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const matches = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('parentApprovalToken'), token))
      .take(1);

    const user = matches[0];
    if (!user) throw new ConvexError({ code: 'TOKEN_NOT_FOUND' });
    if (!user.parentApprovalTokenExpiresAt || user.parentApprovalTokenExpiresAt < Date.now()) {
      throw new ConvexError({ code: 'TOKEN_EXPIRED' });
    }

    await ctx.db.patch(user._id, {
      parentApproved: true,
      parentApprovalToken: undefined,
      parentApprovalTokenExpiresAt: undefined,
    });
    return { userId: user._id };
  },
});

export const setFocusCategories = mutation({
  args: {
    categories: v.array(
      v.union(
        v.literal('sleep'),
        v.literal('movement'),
        v.literal('hydration'),
        v.literal('mood'),
        v.literal('mindfulness'),
        v.literal('nutrition'),
      ),
    ),
  },
  handler: async (ctx, { categories }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (categories.length === 0 || categories.length > 3) {
      throw new ConvexError({ code: 'INVALID_FOCUS_COUNT' });
    }

    const unique = Array.from(new Set(categories)) as FocusCategory[];
    await ctx.db.patch(userId, { focusCategories: unique });
    return { count: unique.length };
  },
});

export const completeOnboarding = mutation({
  args: {
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { username, avatarUrl }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' });

    if (!user.focusCategories || user.focusCategories.length === 0) {
      throw new ConvexError({ code: 'FOCUS_NOT_SET' });
    }

    if (username) {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', username))
        .take(1);
      if (existing[0] && existing[0]._id !== userId) {
        throw new ConvexError({ code: 'USERNAME_TAKEN' });
      }
    }

    await ctx.db.patch(userId, {
      username,
      avatarUrl,
      onboardingCompletedAt: Date.now(),
    });
  },
});

const MAX_PAUSE_DAYS = 14;

export const pauseStreak = mutation({
  args: {
    until: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { until, reason }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const now = Date.now();
    const maxUntil = now + MAX_PAUSE_DAYS * 24 * 60 * 60 * 1000;
    if (until <= now || until > maxUntil) {
      throw new ConvexError({ code: 'INVALID_PAUSE_RANGE' });
    }

    const trimmedReason = reason?.trim() || undefined;
    if (trimmedReason && trimmedReason.length > 40) {
      throw new ConvexError({ code: 'INVALID_PAUSE_REASON' });
    }

    await ctx.db.patch(userId, {
      streakPausedFrom: now,
      streakPausedUntil: until,
      streakPauseReason: trimmedReason,
    });
  },
});

const ExperimentStatusValidator = v.union(
  v.literal('trying'),
  v.literal('works'),
  v.literal('not_for_me'),
);

export const setEnvironmentExperiment = mutation({
  args: {
    tipId: v.string(),
    status: ExperimentStatusValidator,
  },
  handler: async (ctx, { tipId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' });

    const current = user.environmentExperiments ?? [];
    const idx = current.findIndex((e) => e.tipId === tipId);
    const next = [...current];
    if (idx === -1) {
      next.push({ tipId, status, startedAt: Date.now() });
    } else {
      next[idx] = { ...next[idx]!, status };
    }
    await ctx.db.patch(userId, { environmentExperiments: next });
  },
});

export const removeEnvironmentExperiment = mutation({
  args: { tipId: v.string() },
  handler: async (ctx, { tipId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const user = await ctx.db.get(userId);
    if (!user) return;
    const current = user.environmentExperiments ?? [];
    const next = current.filter((e) => e.tipId !== tipId);
    await ctx.db.patch(userId, { environmentExperiments: next });
  },
});

export const resumeStreak = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    await ctx.db.patch(userId, {
      streakPausedFrom: undefined,
      streakPausedUntil: undefined,
      streakPauseReason: undefined,
    });
  },
});

export const setReflectionPrefs = mutation({
  args: {
    enabled: v.boolean(),
    time: v.optional(v.string()),
  },
  handler: async (ctx, { enabled, time }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (time !== undefined && !/^\d{2}:\d{2}$/.test(time)) {
      throw new ConvexError({ code: 'INVALID_TIME_FORMAT' });
    }

    await ctx.db.patch(userId, {
      reflectionEnabled: enabled,
      reflectionTime: time,
    });
  },
});

export const setFreshStartOptIn = mutation({
  args: { optIn: v.boolean() },
  handler: async (ctx, { optIn }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    await ctx.db.patch(userId, { freshStartOptIn: optIn });
  },
});

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const setSchoolSemesterDates = mutation({
  args: { dates: v.array(v.string()) },
  handler: async (ctx, { dates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    if (dates.length > 4) throw new ConvexError({ code: 'TOO_MANY_DATES' });
    for (const d of dates) {
      if (!DATE_PATTERN.test(d)) {
        throw new ConvexError({ code: 'INVALID_DATE_FORMAT' });
      }
    }
    await ctx.db.patch(userId, { schoolSemesterDates: dates });
  },
});

export const setZenMode = mutation({
  args: { zenMode: v.boolean() },
  handler: async (ctx, { zenMode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    await ctx.db.patch(userId, { zenMode });
  },
});

export const setHideFromLeaderboards = mutation({
  args: { hide: v.boolean() },
  handler: async (ctx, { hide }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    await ctx.db.patch(userId, { hideFromLeaderboards: hide });
  },
});

const MAX_IDENTITY_LENGTH = 120;

export const setIdentityStatements = mutation({
  args: {
    statements: v.record(v.string(), v.string()),
  },
  handler: async (ctx, { statements }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' });

    const focusCategories = user.focusCategories ?? [];
    const cleaned: Record<string, string> = {};
    for (const cat of focusCategories) {
      const raw = statements[cat];
      if (!raw) continue;
      const trimmed = raw.trim();
      if (trimmed.length === 0) continue;
      if (trimmed.length > MAX_IDENTITY_LENGTH) {
        throw new ConvexError({ code: 'IDENTITY_TOO_LONG' });
      }
      cleaned[cat] = trimmed;
    }

    await ctx.db.patch(userId, { identityStatements: cleaned });
    return { count: Object.keys(cleaned).length };
  },
});

/**
 * Stores the user's Rubin tendency. Rebels default to `hideFromLeaderboards`
 * the first time their tendency is set to rebel — social ranking is the single
 * biggest churn driver for that type. Users can flip it back later.
 */
export const setTendency = mutation({
  args: {
    tendency: v.union(
      v.literal('upholder'),
      v.literal('questioner'),
      v.literal('obliger'),
      v.literal('rebel'),
    ),
  },
  handler: async (ctx, { tendency }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' });

    const firstTimeRebel = tendency === 'rebel' && user.tendency !== 'rebel';
    await ctx.db.patch(userId, {
      tendency,
      ...(firstTimeRebel ? { hideFromLeaderboards: true } : {}),
    });
  },
});
