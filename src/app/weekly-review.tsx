import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon, type IconName } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import { type FocusCategory } from '@shared/constants/focus';

const FOCUS_ICONS: Record<FocusCategory, IconName> = {
  sleep: 'moon-outline',
  movement: 'walk-outline',
  hydration: 'water-outline',
  mood: 'heart-outline',
  mindfulness: 'flower-outline',
  nutrition: 'nutrition-outline',
};

const FOCUS_LABELS: Record<FocusCategory, string> = {
  sleep: 'focusPicker.sleep',
  movement: 'focusPicker.movement',
  hydration: 'focusPicker.hydration',
  mood: 'focusPicker.mood',
  mindfulness: 'focusPicker.mindfulness',
  nutrition: 'focusPicker.nutrition',
};

export default function WeeklyReviewScreen() {
  const { t } = useTranslation();
  const review = useQuery(api.focusProgress.weeklyReview, { offsetWeeks: 0 });

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  if (review === undefined) {
    return (
      <Screen>
        <Text className="text-base text-foreground-secondary">{t('common.loading')}</Text>
      </Screen>
    );
  }

  if (review === null) {
    return (
      <Screen>
        <Text className="text-base text-foreground-secondary">{t('common.loading')}</Text>
      </Screen>
    );
  }

  const { buckets, totalActiveDays, moodEntries, avgMood, moodDelta } = review;

  return (
    <Screen padded={false} safe={false}>
      <ModalHeader title={t('weeklyReview.title')} onClose={closeScreen} />

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">{t('weeklyReview.heading')}</Text>
        <Text className="text-sm text-foreground-secondary">
          {t('weeklyReview.range', { start: review.weekStart, end: review.weekEnd })}
        </Text>

        <Card elevated>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-foreground-secondary">
                {t('weeklyReview.activeDaysLabel')}
              </Text>
              <Text className="text-4xl font-bold text-foreground mt-1">
                {totalActiveDays}<Text className="text-lg text-foreground-secondary">/7</Text>
              </Text>
            </View>
            <View>
              <Text className="text-xs text-foreground-secondary">
                {t('weeklyReview.moodEntriesLabel')}
              </Text>
              <Text className="text-4xl font-bold text-foreground mt-1">{moodEntries}</Text>
            </View>
            <View>
              <Text className="text-xs text-foreground-secondary">
                {t('weeklyReview.avgMoodLabel')}
              </Text>
              <View className="flex-row items-baseline mt-1 gap-1">
                <Text className="text-4xl font-bold text-foreground">
                  {avgMood != null ? avgMood.toFixed(1) : '—'}
                </Text>
                {moodDelta != null && Math.abs(moodDelta) >= 0.3 ? (
                  <Text
                    className={cn(
                      'text-sm font-bold',
                      moodDelta > 0 ? 'text-success' : 'text-warning',
                    )}
                  >
                    {moodDelta > 0 ? '↑' : '↓'}{Math.abs(moodDelta).toFixed(1)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </Card>

        {buckets.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('weeklyReview.noFocus')}
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground mt-2">
              {t('weeklyReview.byFocus')}
            </Text>
            {buckets.map((b) => {
              const focus = b.focus as FocusCategory;
              const delta = b.deltaDays;
              const trend =
                delta > 0
                  ? { color: 'text-success', prefix: '+', key: 'weeklyReview.up' }
                  : delta < 0
                    ? { color: 'text-warning', prefix: '−', key: 'weeklyReview.down' }
                    : { color: 'text-foreground-secondary', prefix: '·', key: 'weeklyReview.flat' };

              return (
                <Card key={focus}>
                  <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-full bg-primary/15 items-center justify-center">
                      <Icon
                        name={FOCUS_ICONS[focus]}
                        size={22}
                        colorClassName="accent-primary"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">
                        {t(FOCUS_LABELS[focus])}
                      </Text>
                      <Text className="text-xs text-foreground-secondary">
                        {t(trend.key, { delta: Math.abs(delta) })}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-foreground">{b.activeDays}/7</Text>
                      <Text className={cn('text-xs font-semibold', trend.color)}>
                        {trend.prefix}{Math.abs(delta)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Card onPress={() => router.push('/focus-picker?mode=edit')}>
          <View className="flex-row items-center gap-3">
            <Icon name="options-outline" size={22} colorClassName="accent-primary" />
            <Text className="flex-1 text-sm font-semibold text-foreground">
              {t('profile.editGoals')}
            </Text>
            <Text className="text-sm text-foreground-secondary">→</Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
