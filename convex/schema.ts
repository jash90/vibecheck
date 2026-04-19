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

    // VibeCheck profile — all optional because Convex Auth creates the row
    // before we hydrate them in the onboarding flow.
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    birthYear: v.optional(v.number()),
    level: v.optional(v.number()),
    xp: v.optional(v.number()),
    currentStreak: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    streakFreezeTokens: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    onboardingCompletedAt: v.optional(v.number()),

    // COPPA / GDPR Art. 8
    parentEmail: v.optional(v.string()),
    parentApproved: v.optional(v.boolean()),
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

    // Preferred UI language (ISO 639-1 code). Used server-side to generate
    // AI content in the user's language. Client syncs this from the device
    // locale on every app launch.
    locale: v.optional(v.string()),

    // Safety toggles
    hideFromLeaderboards: v.optional(v.boolean()),

    // Rubin's Four Tendencies. Drives tendency-adaptive defaults + copy across
    // reminders, streak-at-risk pushes, challenge vocabulary, etc.
    tendency: v.optional(
      v.union(
        v.literal('upholder'),
        v.literal('questioner'),
        v.literal('obliger'),
        v.literal('rebel'),
      ),
    ),

    // Identity layer (Clear). One statement per selected focus category —
    // keyed by FocusCategory (sleep/movement/hydration/mood/mindfulness/
    // nutrition). Surfaced on every habit completion as a "vote" for who
    // the user is becoming.
    identityStatements: v.optional(v.record(v.string(), v.string())),

    // "Tryb spokoju" — hides XP, levels, prize amounts, ranking-style copy.
    // Leaves habits, streaks, identity, reflection, and safety intact. For
    // users susceptible to overjustification / social comparison. Rebels get
    // an auto-suggest to enable this right after the tendency quiz.
    zenMode: v.optional(v.boolean()),

    // Streak vacation mode. While `streakPausedUntil > now`, the streak
    // recompute job is a no-op, habits don't demand completion, and habit
    // pushes are suppressed. Safety pings still fire. Max 14 days forward.
    streakPausedUntil: v.optional(v.number()),
    streakPausedFrom: v.optional(v.number()),
    streakPauseReason: v.optional(v.string()),

    // Fresh Start Effect (Milkman). Four trigger types: weekly (Monday),
    // monthly (1st), birthday, semester start. User can opt out, and Rebels
    // get a softer copy + no auto-ritual.
    freshStartOptIn: v.optional(v.boolean()),
    /** YYYY-MM-DD local dates of semester starts the user cares about. */
    schoolSemesterDates: v.optional(v.array(v.string())),
    /** Unix ms of last ritual completion — used to dedupe same-day banners. */
    lastFreshStartRitualAt: v.optional(v.number()),

    // Evening reflection (Heath/Clear). Opt-in nightly 60-second prompt.
    reflectionEnabled: v.optional(v.boolean()),
    /** Local HH:MM at which the reminder should fire when push lands. */
    reflectionTime: v.optional(v.string()),

    // 1:1 accountability partnership (Rubin / Karlan). One active partner at
    // a time. Privacy: partner sees habit names + today's completion state
    // only — never mood logs, notes, identity statements, reflections.
    accountabilityPartnerId: v.optional(v.id('users')),
    partnershipStartedAt: v.optional(v.number()),

    // Environment design experiments (Heath). User opts into small physical
    // setup changes — charger outside bedroom, water bottle on desk, etc. —
    // and tracks whether each one actually moved the needle.
    environmentExperiments: v.optional(
      v.array(
        v.object({
          tipId: v.string(),
          startedAt: v.number(),
          status: v.union(
            v.literal('trying'),
            v.literal('works'),
            v.literal('not_for_me'),
          ),
        }),
      ),
    ),

    // Subscription — PRD §9. Tier gates non-safety premium features only.
    subscriptionTier: v.optional(
      v.union(v.literal('free'), v.literal('pro'), v.literal('family')),
    ),
    subscriptionExpiresAt: v.optional(v.number()),
    familyPlanId: v.optional(v.string()),
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
    // Optional measurable target per completion (e.g. 30 min, 8 glasses).
    // Legacy binary-logged habits leave these unset.
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(
      v.union(
        v.literal('min'),
        v.literal('glass'),
        v.literal('step'),
        v.literal('page'),
        v.literal('meal'),
      ),
    ),
    createdAt: v.number(),
    isActive: v.boolean(),
    // Identity category this habit "votes for" — FocusCategory key (not habit
    // category literal). Defaults to normalizeCategory(habit.category) on
    // create. Lookup into users.identityStatements for reinforcement copy.
    identityCategory: v.optional(v.string()),
    // Gollwitzer implementation intention — "when I X". Surfaces in reminders.
    cueContext: v.optional(v.string()),
    // Coping plan — "if Y, I will do Z". Surfaces on missed-day re-engagement.
    copingPlan: v.optional(v.string()),
    // Habit stacking — parent habit whose completion triggers this one.
    stackedAfterHabitId: v.optional(v.id('habits')),
    stackReminderEnabled: v.optional(v.boolean()),
    // Fogg tiny-habit fallback — 30-second version kept for really hard days.
    // Long-press on the habit row logs this variant instead of the full one.
    // Streak + identity credit are preserved; XP is reduced.
    minimumVersion: v.optional(v.string()),
  })
    .index('by_user', ['userId', 'isActive'])
    .index('by_stack_parent', ['stackedAfterHabitId']),

  habitLogs: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    completedAt: v.number(),
    localDate: v.string(), // YYYY-MM-DD in user's tz — for daily grouping
    note: v.optional(v.string()),
    mood: v.optional(v.number()), // 1-10 snapshot
    durationMinutes: v.optional(v.number()),
    isMinimumVersion: v.optional(v.boolean()),
    // Actual measured value for habits with a target (e.g. 25 for "25 min").
    value: v.optional(v.number()),
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

  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal('mental'),
      v.literal('physical'),
      v.literal('sleep'),
      v.literal('nutrition'),
      v.literal('mindfulness'),
      v.literal('hydration'),
      v.literal('mixed'),
    ),
    durationDays: v.number(),
    xpReward: v.number(),
    targetPerPerson: v.number(), // e.g. 7 logs in 7 days for a "log every day" challenge
    startDate: v.number(),
    endDate: v.number(),
    creatorId: v.id('users'),
    isPublic: v.boolean(),
    status: v.union(v.literal('upcoming'), v.literal('active'), v.literal('completed')),
    // Set once by internal.challenges.finalize after endDate. Idempotency guard.
    finalizedAt: v.optional(v.number()),
    /** Set when the user converts a completed challenge into a standing habit. */
    convertedToHabitId: v.optional(v.id('habits')),
  })
    .index('by_creator', ['creatorId'])
    .index('by_status_and_end', ['status', 'endDate']),

  challengeParticipants: defineTable({
    challengeId: v.id('challenges'),
    userId: v.id('users'),
    joinedAt: v.number(),
    progress: v.number(), // 0..targetPerPerson
    lastLogAt: v.optional(v.number()),
    // YYYY-MM-DD in user's tz — used to enforce "one tick per day".
    lastLogDate: v.optional(v.string()),
    // Populated during finalize. 0 = no prize won, >0 = amount credited.
    awardedXp: v.optional(v.number()),
    // Dense rank (1..3) at finalization among ranked participants.
    finalRank: v.optional(v.number()),
  })
    .index('by_challenge', ['challengeId'])
    .index('by_user', ['userId']),

  userAchievements: defineTable({
    userId: v.id('users'),
    achievementId: v.string(), // stable code identifier e.g. 'first_week'
    unlockedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_achievement', ['userId', 'achievementId']),

  lifeSkills: defineTable({
    userId: v.id('users'),
    skill: v.union(
      v.literal('sleep_mastery'),
      v.literal('physical_resilience'),
      v.literal('emotional_intelligence'),
      v.literal('body_awareness'),
      v.literal('discipline'),
    ),
    xp: v.number(),
    level: v.number(), // 1..5
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_skill', ['userId', 'skill']),

  pushTokens: defineTable({
    userId: v.id('users'),
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
    lastSeenAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_token', ['token']),

  notificationPreferences: defineTable({
    userId: v.id('users'),
    dailyReminderEnabled: v.boolean(),
    reminderHour: v.number(), // 0..23 local time
    reminderMinute: v.number(), // 0..59
    lowMoodAlertsEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  insights: defineTable({
    userId: v.id('users'),
    kind: v.union(
      v.literal('weekly_report'),
      v.literal('correlation'),
      v.literal('adulting_tip'),
    ),
    summary: v.string(),
    action: v.optional(v.string()),
    generatedAt: v.number(),
    model: v.string(),
    safetyPassed: v.boolean(),
  })
    .index('by_user_and_generatedAt', ['userId', 'generatedAt'])
    .index('by_user_and_kind', ['userId', 'kind']),

  partnershipRequests: defineTable({
    userId: v.id('users'),
    toUserId: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('declined'),
      v.literal('ended'),
    ),
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    endedByUserId: v.optional(v.id('users')),
  })
    .index('by_from', ['userId'])
    .index('by_to', ['toUserId'])
    .index('by_to_and_status', ['toUserId', 'status']),

  reflections: defineTable({
    userId: v.id('users'),
    /** YYYY-MM-DD local date the reflection covers. */
    date: v.string(),
    whatWorked: v.optional(v.string()),
    whatFriction: v.optional(v.string()),
    tomorrowCommitment: v.optional(v.string()),
    tomorrowCommitmentFulfilled: v.optional(
      v.union(v.literal('done'), v.literal('skipped'), v.literal('released')),
    ),
    createdAt: v.number(),
  })
    .index('by_user_and_date', ['userId', 'date']),

  brightSpots: defineTable({
    userId: v.id('users'),
    /** YYYY-MM-DD of the Monday that begins the reflected week. */
    weekStart: v.string(),
    /** YYYY-MM-DD of the picked best day. */
    bestDayDate: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index('by_user_and_weekStart', ['userId', 'weekStart']),

  badHabits: defineTable({
    userId: v.id('users'),
    name: v.string(),
    cueTime: v.optional(v.string()),
    cueLocation: v.optional(v.string()),
    cueEmotion: v.optional(v.string()),
    cueTrigger: v.optional(v.string()),
    rewardType: v.union(
      v.literal('stimulation'),
      v.literal('escape'),
      v.literal('comfort'),
      v.literal('connection'),
      v.literal('control'),
      v.literal('other'),
    ),
    rewardDescription: v.string(),
    /** Free-text list of picked substitute routines for v1. */
    substituteTexts: v.optional(v.array(v.string())),
    /** Reserved — once user converts substitutes into real habits, store IDs here. */
    substitutionHabitIds: v.optional(v.array(v.id('habits'))),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index('by_user_and_endedAt', ['userId', 'endedAt']),

  badHabitLogs: defineTable({
    userId: v.id('users'),
    badHabitId: v.id('badHabits'),
    /** YYYY-MM-DD local date. One log per day per bad habit. */
    date: v.string(),
    outcome: v.union(
      v.literal('did_original'),
      v.literal('did_substitute'),
      v.literal('resisted_without_sub'),
      v.literal('not_triggered'),
    ),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_badHabit_and_date', ['badHabitId', 'date'])
    .index('by_user_and_date', ['userId', 'date']),

  commitments: defineTable({
    userId: v.id('users'),
    text: v.string(),
    sourceEvent: v.union(
      v.literal('monday'),
      v.literal('month'),
      v.literal('birthday'),
      v.literal('semester'),
      v.literal('manual'),
    ),
    /** Unix ms covering the window the commitment lives in. */
    periodStart: v.number(),
    periodEnd: v.number(),
    habitId: v.optional(v.id('habits')),
    fulfilled: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_user_and_period', ['userId', 'periodStart'])
    .index('by_user_and_fulfilled', ['userId', 'fulfilled']),
});
