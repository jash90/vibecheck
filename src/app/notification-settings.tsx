import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import {
  cancelDailyReminder,
  requestAndRegisterPushToken,
  scheduleDailyReminder,
} from '@shared/lib/notifications';
import { type FocusCategory } from '@shared/constants/focus';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const preferences = useQuery(api.pushTokens.getMyPreferences);
  const setPrefs = useMutation(api.pushTokens.setMyPreferences);
  const registerToken = useMutation(api.pushTokens.register);
  const me = useQuery(api.users.me);

  const [enabled, setEnabled] = useState(true);
  const [lowMoodEnabled, setLowMoodEnabled] = useState(true);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.dailyReminderEnabled);
      setLowMoodEnabled(preferences.lowMoodAlertsEnabled);
      setHour(preferences.reminderHour);
      setMinute(preferences.reminderMinute);
    }
  }, [preferences]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await requestAndRegisterPushToken();
      if (token) {
        await registerToken({ token: token.token, platform: token.platform });
      }

      await setPrefs({
        dailyReminderEnabled: enabled,
        reminderHour: hour,
        reminderMinute: minute,
        lowMoodAlertsEnabled: lowMoodEnabled,
      });

      if (enabled) {
        const topFocus = (me?.focusCategories?.[0] ?? null) as FocusCategory | null;
        const bodyKey = topFocus ? `notifications.bodyFor.${topFocus}` : 'notifications.body';
        await scheduleDailyReminder(
          hour,
          minute,
          t('notifications.title'),
          t(bodyKey, { defaultValue: t('notifications.body') }),
        );
      } else {
        await cancelDailyReminder();
      }
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false} safe={false}>
      <ModalHeader title={t('notifications.settingsTitle')} />
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-5">

        <Card>
          <View className="flex-row items-start gap-3 py-1">
            <View className="flex-1">
              <Text className="text-base text-foreground">{t('notifications.dailyReminder')}</Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('notifications.dailyReminderHint')}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
        </Card>

        {enabled ? (
          <Card>
            <Text className="text-base font-semibold text-foreground mb-3">
              {t('notifications.reminderTime')}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-xs text-foreground-secondary mb-2">
                  {t('notifications.hour')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {HOURS.map((h) => (
                    <HourChip key={h} hour={h} selected={h === hour} onPress={() => setHour(h)} />
                  ))}
                </ScrollView>
              </View>
            </View>
            <View className="mt-4">
              <Text className="text-xs text-foreground-secondary mb-2">
                {t('notifications.minute')}
              </Text>
              <View className="flex-row gap-2">
                {[0, 15, 30, 45].map((m) => (
                  <MinuteChip key={m} minute={m} selected={m === minute} onPress={() => setMinute(m)} />
                ))}
              </View>
            </View>
            <Text className="text-sm text-foreground-secondary mt-4">
              {t('notifications.previewAt', {
                time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
              })}
            </Text>
          </Card>
        ) : null}

        <Card>
          <View className="flex-row items-start gap-3 py-1">
            <View className="flex-1">
              <Text className="text-base text-foreground">{t('notifications.lowMoodAlerts')}</Text>
              <Text className="text-xs text-foreground-secondary mt-1">
                {t('notifications.lowMoodAlertsHint')}
              </Text>
            </View>
            <Switch
              value={lowMoodEnabled}
              onValueChange={setLowMoodEnabled}
              thumbColorClassName="accent-white"
              trackColorOnClassName="accent-primary"
              trackColorOffClassName="accent-muted/40"
            />
          </View>
        </Card>

        <Button
          label={saving ? t('common.loading') : t('common.save')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={saving}
          onPress={handleSave}
        />
      </ScrollView>
    </Screen>
  );
}

interface ChipProps {
  selected: boolean;
  onPress: () => void;
}

function HourChip({ hour, selected, onPress }: ChipProps & { hour: number }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'px-3 py-2 rounded-xl border',
        selected
          ? 'bg-primary border-primary'
          : 'bg-card border-border active:bg-card-elevated',
      )}
    >
      <Text
        className={cn(
          'text-sm font-semibold w-6 text-center',
          selected ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        {String(hour).padStart(2, '0')}
      </Text>
    </Pressable>
  );
}

function MinuteChip({ minute, selected, onPress }: ChipProps & { minute: number }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-1 px-3 py-2 rounded-xl items-center border',
        selected
          ? 'bg-primary border-primary'
          : 'bg-card border-border active:bg-card-elevated',
      )}
    >
      <Text
        className={cn(
          'text-sm font-semibold',
          selected ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        :{String(minute).padStart(2, '0')}
      </Text>
    </Pressable>
  );
}
