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
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakFreezeTokens: user.streakFreezeTokens,
      onboardingCompletedAt: user.onboardingCompletedAt,
      parentApproved: user.parentApproved,
      parentEmail: user.parentEmail,
      focusCategories: user.focusCategories,
      hideFromLeaderboards: user.hideFromLeaderboards,
    };
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

    await ctx.db.patch(userId, {
      parentEmail,
      parentApproved: false,
      parentApprovalRequestedAt: Date.now(),
      parentApprovalToken: token,
      parentApprovalTokenExpiresAt: expires,
    });

    // Phase 1: stub email send — will wire Resend action in follow-up commit
    return { skipped: false as const, token };
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

export const setHideFromLeaderboards = mutation({
  args: { hide: v.boolean() },
  handler: async (ctx, { hide }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });
    await ctx.db.patch(userId, { hideFromLeaderboards: hide });
  },
});
