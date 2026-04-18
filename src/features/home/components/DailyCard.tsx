import { Pressable, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { cn } from '@shared/lib/cn';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DailyCard() {
  const { t } = useTranslation();
  const today = todayISO();
  const habits = useQuery(api.habits.listMine);
  const logs = useQuery(api.habitLogs.listForDate, { localDate: today });
  const logCompletion = useMutation(api.habitLogs.logCompletion);

  if (habits === undefined || logs === undefined) {
    return (
      <Card>
        <Text className="text-base text-foreground-secondary">{t('common.loading')}</Text>
      </Card>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <Text className="text-base text-foreground-secondary text-center py-4">
          {t('home.emptyHabits')}
        </Text>
      </Card>
    );
  }

  const doneHabitIds = new Set(logs.map((l) => l.habitId));
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();
  const allDone = habits.every((h) => doneHabitIds.has(h._id));

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-foreground">{t('home.dailyCardTitle')}</Text>
        {allDone ? (
          <Text className="text-sm font-semibold text-success">✓ {t('home.allDone')}</Text>
        ) : null}
      </View>
      <View className="gap-2">
        {habits.map((habit) => {
          const isDone = doneHabitIds.has(habit._id);
          return (
            <Pressable
              key={habit._id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void logCompletion({
                  habitId: habit._id,
                  localDate: today,
                  timezoneOffsetMinutes,
                });
              }}
              disabled={isDone}
              className={cn(
                'flex-row items-center gap-3 px-3 py-3 rounded-xl border',
                isDone
                  ? 'bg-success/10 border-success/40'
                  : 'bg-card-elevated border-border active:bg-card-elevated/80',
              )}
            >
              <View
                className={cn(
                  'w-6 h-6 rounded-full border-2 items-center justify-center',
                  isDone ? 'bg-success border-success' : 'border-muted',
                )}
              >
                {isDone ? <Text className="text-white text-xs font-bold">✓</Text> : null}
              </View>
              <Text
                className={cn(
                  'flex-1 text-base',
                  isDone ? 'text-foreground-secondary line-through' : 'text-foreground',
                )}
              >
                {habit.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
