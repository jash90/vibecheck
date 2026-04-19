import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { normalizeCategory } from './_focus';
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

const UnitValidator = v.union(
  v.literal('min'),
  v.literal('glass'),
  v.literal('step'),
  v.literal('page'),
  v.literal('meal'),
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

const MAX_CUE_LENGTH = 140;
const MAX_COPING_LENGTH = 140;
const MAX_MINIMUM_LENGTH = 100;

export const create = mutation({
  args: {
    name: v.string(),
    category: CategoryValidator,
    targetFrequency: FrequencyValidator,
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(UnitValidator),
    cueContext: v.optional(v.string()),
    copingPlan: v.optional(v.string()),
    stackedAfterHabitId: v.optional(v.id('habits')),
    stackReminderEnabled: v.optional(v.boolean()),
    minimumVersion: v.optional(v.string()),
  },
  handler: async (
    ctx,
    {
      name,
      category,
      targetFrequency,
      targetValue,
      targetUnit,
      cueContext,
      copingPlan,
      stackedAfterHabitId,
      stackReminderEnabled,
      minimumVersion,
    },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: 'UNAUTHENTICATED' });

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) {
      throw new ConvexError({ code: 'INVALID_NAME' });
    }

    if (targetValue !== undefined && (targetValue <= 0 || targetValue > 10_000)) {
      throw new ConvexError({ code: 'INVALID_TARGET' });
    }

    const trimmedCue = cueContext?.trim() || undefined;
    if (trimmedCue && trimmedCue.length > MAX_CUE_LENGTH) {
      throw new ConvexError({ code: 'INVALID_CUE_LENGTH' });
    }
    const trimmedCoping = copingPlan?.trim() || undefined;
    if (trimmedCoping && trimmedCoping.length > MAX_COPING_LENGTH) {
      throw new ConvexError({ code: 'INVALID_COPING_LENGTH' });
    }
    const trimmedMinimum = minimumVersion?.trim() || undefined;
    if (trimmedMinimum && trimmedMinimum.length > MAX_MINIMUM_LENGTH) {
      throw new ConvexError({ code: 'INVALID_MINIMUM_LENGTH' });
    }

    let parentName: string | null = null;
    if (stackedAfterHabitId) {
      const parent = await ctx.db.get(stackedAfterHabitId);
      if (!parent || parent.userId !== userId || !parent.isActive) {
        throw new ConvexError({ code: 'INVALID_STACK_PARENT' });
      }
      parentName = parent.name;
    }

    // Auto-fill cue context from parent habit name if the user left it blank.
    const finalCue =
      trimmedCue ?? (parentName ? `Po: ${parentName}` : undefined);

    return ctx.db.insert('habits', {
      userId,
      name: trimmed,
      category,
      targetFrequency,
      targetValue,
      targetUnit,
      createdAt: Date.now(),
      isActive: true,
      identityCategory: normalizeCategory(category),
      cueContext: finalCue,
      copingPlan: trimmedCoping,
      stackedAfterHabitId,
      stackReminderEnabled: stackedAfterHabitId
        ? stackReminderEnabled ?? true
        : undefined,
      minimumVersion: trimmedMinimum,
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
