import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';

import { mutation, query } from './_generated/server';

export const getMyTier = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { tier: 'free' as const, expiresAt: null };
    const user = await ctx.db.get(userId);
    if (!user) return { tier: 'free' as const, expiresAt: null };

    const rawTier = 'subscriptionTier' in user ? user.subscriptionTier : undefined;
    const tier: 'free' | 'pro' | 'family' = rawTier ?? 'free';
    const expiresAtField =
      'subscriptionExpiresAt' in user ? user.subscriptionExpiresAt : undefined;
    const expiresAt = expiresAtField ?? null;

    if (tier !== 'free' && expiresAt && expiresAt < Date.now()) {
      return { tier: 'free' as const, expiresAt: null };
    }

    return { tier, expiresAt };
  },
});

/**
 * Dev-only stub — simulates a Pro upgrade. In production, the RevenueCat
 * webhook calls `internal.subscriptions.setTier` (not exposed here) on
 * purchase/renewal events.
 */
export const upgradeProStub = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const oneYear = 365 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(userId, {
      subscriptionTier: 'pro',
      subscriptionExpiresAt: Date.now() + oneYear,
    });
  },
});
