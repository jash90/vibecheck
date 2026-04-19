import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

type Outcome = 'did_original' | 'did_substitute' | 'resisted_without_sub' | 'not_triggered';

const OUTCOMES: Outcome[] = [
  'did_substitute',
  'resisted_without_sub',
  'did_original',
  'not_triggered',
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function BadHabitDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const badHabitId = id as unknown as never;
  const detail = useQuery(
    api.badHabits.detail,
    id ? { badHabitId } : 'skip',
  );
  const weekly = useQuery(
    api.badHabits.weeklyBreakdown,
    id ? { badHabitId, days: 7 } : 'skip',
  );
  const logMutation = useMutation(api.badHabits.log);
  const endBadHabit = useMutation(api.badHabits.endBadHabit);

  const today = useMemo(todayISO, []);
  const todaysLog = detail?.logs.find((l) => l.date === today) ?? null;

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/bad-habits');
  }

  async function handleLog(outcome: Outcome) {
    try {
      await logMutation({ badHabitId, date: today, outcome });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  function handleEnd() {
    Alert.alert(
      t('badHabit.endTitle'),
      t('badHabit.endBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('badHabit.endConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await endBadHabit({ badHabitId });
              closeScreen();
            } catch (e) {
              Alert.alert(t('common.error'), (e as Error).message);
            }
          },
        },
      ],
    );
  }

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
        <Text className="text-foreground">{t('common.error')}</Text>
      </Screen>
    );
  }

  const substituteTexts = detail.substituteTexts ?? [];
  const breakdown = weekly?.byOutcome ?? null;
  const substituteDominant =
    weekly && weekly.total > 0 && (weekly.byOutcome.did_substitute ?? 0) / weekly.total >= 0.6;

  return (
    <Screen padded={false} safe>
      <ModalHeader title={detail.name} onClose={closeScreen} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-4"
      >
        <Card>
          <Text className="text-sm font-semibold text-primary mb-1">
            {t(`badHabit.reward.${detail.rewardType}.title`)}
          </Text>
          <Text className="text-sm text-foreground-secondary">
            {detail.rewardDescription}
          </Text>
        </Card>

        {substituteTexts.length > 0 ? (
          <Card>
            <Text className="text-base font-bold text-foreground mb-2">
              {t('badHabit.substitutesTitle')}
            </Text>
            <View className="gap-2">
              {substituteTexts.map((s, i) => (
                <View
                  key={`${i}-${s}`}
                  className="flex-row items-start gap-2 py-1"
                >
                  <Icon name="leaf-outline" size={14} colorClassName="accent-primary" />
                  <Text className="flex-1 text-sm text-foreground">{s}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card elevated>
          <Text className="text-base font-bold text-foreground mb-2">
            {t('badHabit.todayCheckInTitle')}
          </Text>
          <Text className="text-xs text-foreground-secondary mb-3">
            {t('badHabit.todayCheckInBody')}
          </Text>
          <View className="gap-2">
            {OUTCOMES.map((o) => {
              const isSelected = todaysLog?.outcome === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => handleLog(o)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'px-4 py-3 rounded-card border-2',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(`badHabit.outcome.${o}.title`)}
                  </Text>
                  <Text className="text-xs text-foreground-secondary mt-1">
                    {t(`badHabit.outcome.${o}.hint`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {breakdown && weekly?.total && weekly.total > 0 ? (
          <Card>
            <Text className="text-base font-bold text-foreground mb-2">
              {t('badHabit.weekSummaryTitle')}
            </Text>
            <View className="gap-1">
              <Text className="text-xs text-foreground-secondary">
                ✓ {t('badHabit.outcome.did_substitute.title')}:{' '}
                {breakdown.did_substitute ?? 0}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                💪 {t('badHabit.outcome.resisted_without_sub.title')}:{' '}
                {breakdown.resisted_without_sub ?? 0}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                · {t('badHabit.outcome.did_original.title')}:{' '}
                {breakdown.did_original ?? 0}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                · {t('badHabit.outcome.not_triggered.title')}:{' '}
                {breakdown.not_triggered ?? 0}
              </Text>
            </View>
            {substituteDominant ? (
              <Text className="text-sm text-primary font-semibold mt-3">
                {t('badHabit.substituteDominant')}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Button
          label={t('badHabit.endCta')}
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleEnd}
        />
      </ScrollView>
    </Screen>
  );
}
