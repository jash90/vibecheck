import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { cn } from '@shared/lib/cn';

export function PartnerCard() {
  const { t } = useTranslation();
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const view = useQuery(api.partnerships.partnerView, {
    timezoneOffsetMinutes: tzOffset,
  });

  if (view === undefined) return null;
  if (view === null) return null;

  const doneCount = view.habits.filter((h) => h.done).length;
  const total = view.habits.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <Card elevated>
      <Pressable
        onPress={() => router.push('/partnership')}
        accessibilityRole="button"
        className="flex-row items-center gap-3 mb-3"
      >
        <View className="w-11 h-11 rounded-full bg-primary/15 items-center justify-center">
          <Icon name="people" size={22} colorClassName="accent-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('partner.cardLabel')}
          </Text>
          <Text className="text-base font-bold text-foreground">
            {view.username ?? '—'}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Icon name="flame" size={12} colorClassName="accent-flame" />
            <Text className="text-xs text-foreground-secondary">
              {view.currentStreak}
            </Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
      </Pressable>

      {total === 0 ? (
        <Text className="text-sm text-foreground-secondary">
          {t('partner.noHabits')}
        </Text>
      ) : (
        <>
          <Text className="text-xs text-foreground-secondary mb-2">
            {allDone
              ? t('partner.allDone')
              : t('partner.progress', { done: doneCount, total })}
          </Text>
          <View className="gap-1.5">
            {view.habits.map((h) => (
              <View
                key={h.habitId}
                className={cn(
                  'flex-row items-center gap-2 px-3 py-2 rounded-xl border',
                  h.done
                    ? 'bg-success/10 border-success/40'
                    : 'bg-card border-border',
                )}
              >
                <View
                  className={cn(
                    'w-4 h-4 rounded-full border-2 items-center justify-center',
                    h.done ? 'bg-success border-success' : 'border-muted',
                  )}
                >
                  {h.done ? <Text className="text-white text-[9px] font-bold">✓</Text> : null}
                </View>
                <Text
                  className={cn(
                    'flex-1 text-sm',
                    h.done ? 'text-foreground-secondary' : 'text-foreground',
                  )}
                  numberOfLines={1}
                >
                  {h.name}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}
