import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ...authTables,

  users: defineTable({
    // auth provider-managed base fields (name, email, image, emailVerificationTime) come from authTables
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // VibeCheck profile
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    birthYear: v.optional(v.number()),
    level: v.number(),
    xp: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    streakFreezeTokens: v.number(),
    joinedAt: v.number(),
    onboardingCompletedAt: v.optional(v.number()),

    // COPPA / GDPR Art. 8
    parentEmail: v.optional(v.string()),
    parentApproved: v.boolean(),
    parentApprovalRequestedAt: v.optional(v.number()),
    parentApprovalToken: v.optional(v.string()),
    parentApprovalTokenExpiresAt: v.optional(v.number()),

    // Focus categories (max 3) — F-O2
    focusCategories: v.optional(
      v.array(
        v.union(
          v.literal('sleep'),
          v.literal('movement'),
          v.literal('hydration'),
          v.literal('mood'),
          v.literal('mindfulness'),
          v.literal('nutrition'),
        ),
      ),
    ),

    // Safety toggles
    hideFromLeaderboards: v.boolean(),
  })
    .index('email', ['email'])
    .index('by_username', ['username']),

  habits: defineTable({
    userId: v.id('users'),
    name: v.string(),
    category: v.union(
      v.literal('mental'),
      v.literal('physical'),
      v.literal('sleep'),
      v.literal('nutrition'),
      v.literal('mindfulness'),
      v.literal('hydration'),
    ),
    targetFrequency: v.union(
      v.literal('daily'),
      v.literal('3x_week'),
      v.literal('weekly'),
    ),
    createdAt: v.number(),
    isActive: v.boolean(),
  }).index('by_user', ['userId', 'isActive']),

  habitLogs: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    completedAt: v.number(),
    localDate: v.string(), // YYYY-MM-DD in user's tz — for daily grouping
    note: v.optional(v.string()),
    mood: v.optional(v.number()), // 1-10 snapshot
    durationMinutes: v.optional(v.number()),
  })
    .index('by_user_and_date', ['userId', 'localDate'])
    .index('by_habit', ['habitId', 'completedAt']),

  moodLogs: defineTable({
    userId: v.id('users'),
    mood: v.number(), // 1-10
    emotions: v.array(v.string()),
    note: v.optional(v.string()),
    loggedAt: v.number(),
    localDate: v.string(),
  }).index('by_user_and_date', ['userId', 'localDate']),

  friendships: defineTable({
    userAId: v.id('users'),
    userBId: v.id('users'),
    status: v.union(v.literal('pending'), v.literal('active')),
    requestedAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index('by_userA', ['userAId', 'status'])
    .index('by_userB', ['userBId', 'status']),

  // Phase 2 — defined now so later migrations stay additive
  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    durationDays: v.number(),
    xpReward: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    creatorId: v.id('users'),
    isPublic: v.boolean(),
  }).index('by_creator', ['creatorId']),
});
