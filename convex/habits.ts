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
);

const FrequencyValidator = v.union(
  v.literal('daily'),
  v.literal('3x_week'),
  v.literal('weekly'),
);

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query('habits')
      .withIndex('by_user', (q) => q.eq('userId', userId).eq('isActive', true))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: CategoryValidator,
    targetFrequency: FrequencyValidator,
  },
  handler: async (ctx, { name, category, targetFrequency }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) {
      throw new ConvexError({ code: 'INVALID_NAME' });
    }

    const activeCount = await ctx.db
      .query('habits')
      .withIndex('by_user', (q) => q.eq('userId', userId).eq('isActive', true))
      .collect();

    if (activeCount.length >= 3) {
      const user = await ctx.db.get(userId);
      const tier =
        user && 'subscriptionTier' in user ? (user.subscriptionTier ?? 'free') : 'free';
      if (tier === 'free') {
        throw new ConvexError({ code: 'HABIT_LIMIT_FREE_TIER' });
      }
    }

    return ctx.db.insert('habits', {
      userId,
      name: trimmed,
      category,
      targetFrequency,
      createdAt: Date.now(),
      isActive: true,
    });
  },
});

export const deactivate = mutation({
  args: { habitId: v.id('habits') },
  handler: async (ctx, { habitId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const habit = await ctx.db.get(habitId);
    if (!habit || habit.userId !== userId) {
      throw new ConvexError({ code: 'NOT_FOUND' });
    }

    await ctx.db.patch(habitId, { isActive: false });
  },
});
