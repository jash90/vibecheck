import Constants from 'expo-constants';
import { ConvexReactClient } from 'convex/react';

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  (Constants.expoConfig?.extra as { convexUrl?: string } | undefined)?.convexUrl;

if (!convexUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_CONVEX_URL. Run `bun dev:convex` once to create a deployment, then paste the URL into .env.',
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});
