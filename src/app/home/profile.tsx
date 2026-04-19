import { ScrollView, Switch, Text, View } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const setHide = useMutation(api.users.setHideFromLeaderboards);
  const setZenMode = useMutation(api.users.setZenMode);
  const setFreshStartOptIn = useMutation(api.users.setFreshStartOptIn);
  const setReflectionPrefs = useMutation(api.users.setReflectionPrefs);

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        <View className="items-center gap-2 mb-4">
          <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center">
            <Icon name="person" size={48} colorClassName="accent-primary" />
          </View>
          <Text className="text-2xl font-bold text-foreground">{user?.username ?? '—'}</Text>
          <View className="flex-row items-center gap-1.5">
            {!user?.zenMode ? (
              <Text className="text-sm text-foreground-secondary">
                {t('home.level', { level: user?.level ?? 1 })} ·
              </Text>
            ) : null}
            <Icon name="flame" size={14} colorClassName="accent-flame" />
            <Text className="text-sm text-foreground-secondary">{user?.currentStreak ?? 0}</Text>
          </View>
        </View>

        <Card>
          <Text className="text-base font-bold text-foreground mb-3">{t('profile.zenTitle')}</Text>
          <View className="flex-row items-start gap-3 py-2">
            <View className="flex-1">
              <Text className="text-base text-foreground">
                {t('profile.zenToggle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('profile.zenHint')}
              </Text>
            </View>
            <Switch
              value={user?.zenMode ?? false}
              onValueChange={(zenMode) => void setZenMode({ zenMode })}
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
        </Card>

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
          <View className="flex-row items-start gap-3 py-2 border-t border-border/40 mt-1 pt-3">
            <View className="flex-1">
              <Text className="text-base text-foreground">
                {t('profile.freshStartToggle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('profile.freshStartHint')}
              </Text>
            </View>
            <Switch
              value={user?.freshStartOptIn ?? true}
              onValueChange={(optIn) => void setFreshStartOptIn({ optIn })}
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
          <View className="flex-row items-start gap-3 py-2 border-t border-border/40 mt-1 pt-3">
            <View className="flex-1">
              <Text className="text-base text-foreground">
                {t('profile.reflectionToggle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('profile.reflectionHint')}
              </Text>
            </View>
            <Switch
              value={user?.reflectionEnabled ?? false}
              onValueChange={(enabled) =>
                void setReflectionPrefs({
                  enabled,
                  time: user?.reflectionTime ?? '21:00',
                })
              }
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
        </Card>

        <Card onPress={() => router.push('/identity-picker?mode=edit')}>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('profile.identityTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {user?.identityStatements && Object.keys(user.identityStatements).length > 0
                  ? t('profile.identitySet', {
                      count: Object.keys(user.identityStatements).length,
                    })
                  : t('profile.identityNotSet')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
          </View>
        </Card>

        <Card onPress={() => router.push('/tendency-quiz?mode=edit')}>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('profile.tendencyTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {user?.tendency
                  ? t(`tendency.result.${user.tendency}`)
                  : t('profile.tendencyNotSet')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
          </View>
        </Card>

        <Card onPress={() => router.push('/pause-streak')}>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('profile.pauseTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {user?.streakPausedUntil && user.streakPausedUntil > Date.now()
                  ? t('profile.pauseActive')
                  : t('profile.pauseHint')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
          </View>
        </Card>

        <Card onPress={() => router.push('/environment-experiments')}>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('profile.experimentsTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {(user?.environmentExperiments?.length ?? 0) > 0
                  ? t('profile.experimentsCount', {
                      count: user!.environmentExperiments!.length,
                    })
                  : t('profile.experimentsNone')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
          </View>
        </Card>

        <Button
          label={t('profile.editGoals')}
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.push('/focus-picker?mode=edit')}
        />

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
