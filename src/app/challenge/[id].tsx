import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function ChallengeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = id as unknown as never;
  const detail = useQuery(api.challenges.detail, id ? { challengeId } : 'skip');
  const join = useMutation(api.challenges.join);
  const leave = useMutation(api.challenges.leave);
  const logProgress = useMutation(api.challenges.logProgress);

  if (!id) {
    return (
      <Screen>
        <Text className="text-foreground">{t('common.error')}</Text>
      </Screen>
    );
  }

  if (detail === undefined) {
    return (
      <Screen>
        <Text className="text-foreground-secondary">{t('common.loading')}</Text>
      </Screen>
    );
  }

  if (detail === null) {
    return (
      <Screen>
        <Text className="text-foreground">{t('challenge.notFound')}</Text>
      </Screen>
    );
  }

  const percent = Math.min(
    100,
    Math.round((detail.myProgress / detail.targetPerPerson) * 100),
  );
  const collectiveProgress = detail.participants.reduce((acc, p) => acc + p.progress, 0);
  const collectiveTarget = detail.targetPerPerson * detail.participants.length;
  const collectivePercent = collectiveTarget > 0
    ? Math.round((collectiveProgress / collectiveTarget) * 100)
    : 0;

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-8 gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{detail.title}</Text>
          <Text className="text-base text-foreground-secondary">{detail.description}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="px-2 py-1 rounded-pill bg-card border border-border">
              <Text className="text-xs font-medium text-foreground">
                {t('challenge.endsIn', { count: daysUntil(detail.endDate) })}
              </Text>
            </View>
            <View className="px-2 py-1 rounded-pill bg-primary/20">
              <Text className="text-xs font-semibold text-primary">+{detail.xpReward} XP</Text>
            </View>
          </View>
        </View>

        {detail.amIJoined ? (
          <Card elevated>
            <Text className="text-sm font-semibold text-foreground-secondary mb-2">
              {t('challenge.myProgress', {
                current: detail.myProgress,
                target: detail.targetPerPerson,
              })}
            </Text>
            <View className="h-3 rounded-pill bg-border overflow-hidden">
              <View
                className={cn('h-full bg-primary rounded-pill')}
                style={{ width: `${percent}%` }}
              />
            </View>
            <View className="mt-4 flex-row gap-2">
              <Button
                label={t('challenge.logProgress')}
                variant="primary"
                size="md"
                fullWidth
                onPress={async () => {
                  try {
                    await logProgress({ challengeId });
                  } catch (e) {
                    Alert.alert(t('common.error'), (e as Error).message);
                  }
                }}
              />
            </View>
            <Button
              label={t('challenge.leave')}
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-2"
              onPress={() => {
                Alert.alert(t('challenge.leave'), t('challenge.leaveConfirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('challenge.leave'),
                    style: 'destructive',
                    onPress: async () => {
                      await leave({ challengeId });
                      router.back();
                    },
                  },
                ]);
              }}
            />
          </Card>
        ) : (
          <Button
            label={t('challenge.join')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={async () => {
              try {
                await join({ challengeId });
              } catch (e) {
                Alert.alert(t('common.error'), (e as Error).message);
              }
            }}
          />
        )}

        <Card>
          <Text className="text-base font-bold text-foreground mb-2">
            {t('challenge.collective')}
          </Text>
          <Text className="text-xs text-foreground-secondary mb-3">
            {collectiveProgress} / {collectiveTarget}
          </Text>
          <View className="h-3 rounded-pill bg-border overflow-hidden">
            <View
              className={cn('h-full bg-accent rounded-pill')}
              style={{ width: `${collectivePercent}%` }}
            />
          </View>
        </Card>

        <Card>
          <Text className="text-base font-bold text-foreground mb-3">
            {t('challenge.participants')}
          </Text>
          <View className="gap-2">
            {detail.participants.map((p) => (
              <View
                key={p.userId}
                className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
              >
                <View className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-lg">🙂</Text>
                </View>
                <Text className="flex-1 text-base text-foreground">
                  {p.username ?? '—'}
                </Text>
                <Text className="text-sm text-foreground-secondary font-semibold">
                  {p.progress} / {detail.targetPerPerson}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
