import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_OPTIONS = [1, 3, 7, 14] as const;

type ReasonKey = 'illness' | 'vacation' | 'exams' | 'break' | 'other';

const REASON_OPTIONS: ReasonKey[] = ['illness', 'vacation', 'exams', 'break', 'other'];

function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export default function PauseStreakScreen() {
  const { t, i18n } = useTranslation();
  const me = useQuery(api.users.me);
  const pauseStreak = useMutation(api.users.pauseStreak);
  const resumeStreak = useMutation(api.users.resumeStreak);

  const [days, setDays] = useState<number>(3);
  const [reasonKey, setReasonKey] = useState<ReasonKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const isPaused = Boolean(
    me?.streakPausedUntil && me.streakPausedUntil > Date.now(),
  );

  async function handlePause() {
    setSubmitting(true);
    try {
      const until = Date.now() + days * DAY_MS;
      await pauseStreak({
        until,
        reason: reasonKey ? t(`pause.reason.${reasonKey}`) : undefined,
      });
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResume() {
    setSubmitting(true);
    try {
      await resumeStreak({});
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const untilPreview = formatDate(Date.now() + days * DAY_MS, i18n.language);

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('pause.title')} onClose={closeScreen} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-6"
      >
        {isPaused ? (
          <View className="gap-3">
            <Text className="text-base text-foreground">
              {t('pause.activeBody', {
                date: formatDate(me!.streakPausedUntil!, i18n.language),
              })}
            </Text>
            {me?.streakPauseReason ? (
              <Text className="text-sm text-foreground-secondary">
                {t('pause.activeReason', { reason: me.streakPauseReason })}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('pause.durationLabel')}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                {t('pause.durationHint')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DAY_OPTIONS.map((d) => {
                  const isSelected = d === days;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDays(d)}
                      className={cn(
                        'px-4 py-3 rounded-card border-2 min-w-[70px] items-center',
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-border active:bg-card-elevated',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-base font-semibold',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {t('pause.days', { count: d })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('pause.untilPreview', { date: untilPreview })}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('pause.reasonLabel')}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                {t('pause.reasonHint')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {REASON_OPTIONS.map((r) => {
                  const isSelected = reasonKey === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setReasonKey(isSelected ? null : r)}
                      className={cn(
                        'px-3 py-2 rounded-pill border',
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-border active:bg-card-elevated',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {t(`pause.reason.${r}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        {isPaused ? (
          <Button
            label={submitting ? t('common.loading') : t('pause.resumeCta')}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            onPress={handleResume}
          />
        ) : (
          <Button
            label={submitting ? t('common.loading') : t('pause.pauseCta')}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            onPress={handlePause}
          />
        )}
      </View>
    </Screen>
  );
}
