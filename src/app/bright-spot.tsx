import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const MAX_REASON = 280;

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday of the current week in local time. Week starts Monday. */
function mondayOfThisWeek(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export default function BrightSpotScreen() {
  const { t, i18n } = useTranslation();

  const monday = useMemo(() => mondayOfThisWeek(), []);
  const weekStart = isoDay(monday);

  const last7Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { iso: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        iso: isoDay(d),
        label: d.toLocaleDateString(i18n.language, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return days;
  }, [i18n.language]);

  const existing = useQuery(api.brightSpots.thisWeek, { weekStart });
  const logBrightSpot = useMutation(api.brightSpots.log);

  const [bestDay, setBestDay] = useState<string | null>(existing?.bestDayDate ?? null);
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [submitting, setSubmitting] = useState(false);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function handleSave() {
    if (!bestDay || !reason.trim()) return;
    setSubmitting(true);
    try {
      await logBrightSpot({ weekStart, bestDayDate: bestDay, reason: reason.trim() });
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('brightSpot.title')} onClose={closeScreen} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-foreground-secondary">
          {t('brightSpot.subtitle')}
        </Text>

        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">
            {t('brightSpot.pickDay')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {last7Days.map(({ iso, label }) => {
              const isSelected = bestDay === iso;
              return (
                <Pressable
                  key={iso}
                  onPress={() => setBestDay(iso)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">
            {t('brightSpot.reason')}
          </Text>
          <TextInput
            value={reason}
            onChangeText={(txt) => setReason(txt.slice(0, MAX_REASON))}
            placeholder={t('brightSpot.reasonPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[96px]"
          />
        </View>
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        <Button
          label={submitting ? t('common.loading') : t('brightSpot.saveCta')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !bestDay || reason.trim().length === 0}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}
