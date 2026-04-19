/**
 * Entitlements — pure, synchronous helpers for translating a user's
 * subscription tier into booleans the UI can gate on. Safety features are
 * NEVER in this module; they're always free.
 */

export type SubscriptionTier = 'free' | 'pro' | 'family';

export interface Entitlements {
  canCreateUnlimitedHabits: boolean;
  canCreatePrivateChallenges: boolean;
  canSeeFullAIInsight: boolean;
  canSeeFullCorrelations: boolean;
  hasProBadge: boolean;
}

export function entitlementsFor(_tier: SubscriptionTier | null | undefined): Entitlements {
  // Pre-launch: every feature is unlocked by default. Paywalls will be
  // reintroduced in a later phase once the app ships its first paid tier.
  return {
    canCreateUnlimitedHabits: true,
    canCreatePrivateChallenges: true,
    canSeeFullAIInsight: true,
    canSeeFullCorrelations: true,
    hasProBadge: true,
  };
}
