import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '@convex/_generated/api';

export default function RootRedirect() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const state = useQuery(api.users.onboardingState, isAuthenticated ? {} : 'skip');

  if (authLoading || (isAuthenticated && state === undefined)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  const step = state?.step ?? 'age-gate';
  switch (step) {
    case 'blocked':
      return <Redirect href="/blocked" />;
    case 'age-gate':
      return <Redirect href="/age-gate" />;
    case 'parent-consent':
      return <Redirect href="/parent-consent" />;
    case 'awaiting-parent-approval':
      return <Redirect href="/awaiting-parent" />;
    case 'focus-picker':
      return <Redirect href="/focus-picker" />;
    case 'goal-setup':
      return <Redirect href="/profile-setup" />;
    case 'ready':
      return <Redirect href="/home" />;
    default:
      return <Redirect href="/sign-in" />;
  }
}
