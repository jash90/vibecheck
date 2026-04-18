import { ScrollView, Switch, Text, View } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';
import { useEntitlements } from '@shared/hooks/useEntitlements';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const setHide = useMutation(api.users.setHideFromLeaderboards);
  const { entitlements } = useEntitlements();

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        <View className="items-center gap-2 mb-4">
          <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-5xl">🙂</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">{user?.username ?? '—'}</Text>
          <Text className="text-sm text-foreground-secondary">
            {t('home.level', { level: user?.level ?? 1 })} · 🔥 {user?.currentStreak ?? 0}
          </Text>
          {entitlements.hasProBadge ? (
            <View className="mt-1 px-3 py-1 rounded-pill bg-primary">
              <Text className="text-xs font-bold text-primary-foreground">
                {t('paywall.proBadge')}
              </Text>
            </View>
          ) : null}
        </View>

        {!entitlements.hasProBadge ? (
          <Button
            label={t('paywall.upgradeCta')}
            variant="primary"
            size="md"
            fullWidth
            onPress={() => router.push('/paywall')}
          />
        ) : null}

        <Card>
          <Text className="text-base font-bold text-foreground mb-3">{t('profile.settings')}</Text>
          <View className="flex-row items-start gap-3 py-2">
            <View className="flex-1">
              <Text className="text-base text-foreground">
                {t('profile.hideFromLeaderboards')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('profile.hideFromLeaderboardsHint')}
              </Text>
            </View>
            <Switch
              value={user?.hideFromLeaderboards ?? false}
              onValueChange={(hide) => void setHide({ hide })}
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
        </Card>

        <Button
          label={t('profile.notifications')}
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.push('/notification-settings')}
        />

        <Button
          label={t('profile.crisisResources')}
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push('/crisis-resources')}
        />

        <Button
          label={t('profile.signOut')}
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => void signOut()}
        />

        <Text className="text-xs text-foreground-secondary text-center mt-4">
          {t('profile.version', { version: Constants.expoConfig?.version ?? '0.1.0' })}
        </Text>
      </ScrollView>
    </Screen>
  );
}
