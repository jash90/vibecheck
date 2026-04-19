import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';

export default function RootRedirect() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const state = useQuery(api.users.onboardingState, isAuthenticated ? {} : 'skip');
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip');
  const setLocale = useMutation(api.users.setLocale);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || !me) return;
    const deviceLocale = i18n.language ?? 'pl';
    if (me.locale !== deviceLocale) {
      void setLocale({ locale: deviceLocale });
    }
  }, [isAuthenticated, me, i18n.language, setLocale]);

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
    case 'identity-picker':
      return <Redirect href="/identity-picker" />;
    case 'tendency-quiz':
      return <Redirect href="/tendency-quiz" />;
    case 'goal-setup':
      return <Redirect href="/profile-setup" />;
    case 'ready':
      return <Redirect href="/home" />;
    default:
      return <Redirect href="/sign-in" />;
  }
}
