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

export function entitlementsFor(tier: SubscriptionTier | null | undefined): Entitlements {
  const isPaid = tier === 'pro' || tier === 'family';
  return {
    canCreateUnlimitedHabits: isPaid,
    canCreatePrivateChallenges: isPaid,
    canSeeFullAIInsight: isPaid,
    canSeeFullCorrelations: isPaid,
    hasProBadge: isPaid,
  };
}
