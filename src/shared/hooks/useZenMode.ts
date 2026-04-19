import { useQuery } from 'convex/react';

import { api } from '@convex/_generated/api';

/**
 * Returns whether the current user has "Tryb spokoju" enabled. Components use
 * this to strip XP, level, and ranking copy. When the user is not yet loaded,
 * defaults to `false` so the app doesn't flash a zen layout for non-zen users.
 */
export function useZenMode(): boolean {
  const me = useQuery(api.users.me);
  return me?.zenMode ?? false;
}
