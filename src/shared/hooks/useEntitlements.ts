import { useQuery } from 'convex/react';

import { api } from '@convex/_generated/api';
import { entitlementsFor, type SubscriptionTier } from '@shared/lib/entitlements';

export function useEntitlements() {
  const tierInfo = useQuery(api.subscriptions.getMyTier) as
    | { tier: SubscriptionTier; expiresAt: number | null }
    | undefined;
  const tier = tierInfo?.tier ?? 'free';
  return {
    tier,
    expiresAt: tierInfo?.expiresAt ?? null,
    entitlements: entitlementsFor(tier),
    isLoading: tierInfo === undefined,
  };
}
