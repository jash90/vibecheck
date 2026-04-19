import { Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';

interface PausedCardProps {
  until: number;
  reason?: string | null;
}

function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function PausedCard({ until, reason }: PausedCardProps) {
  const { t, i18n } = useTranslation();
  const resumeStreak = useMutation(api.users.resumeStreak);

  return (
    <Card elevated>
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-11 h-11 rounded-full bg-primary/15 items-center justify-center">
          <Icon name="pause" size={22} colorClassName="accent-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {t('paused.title')}
          </Text>
          <Text className="text-xs text-foreground-secondary mt-0.5">
            {t('paused.until', { date: formatDate(until, i18n.language) })}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-foreground-secondary mb-1">
        {t('paused.body')}
      </Text>
      {reason ? (
        <Text className="text-xs text-foreground-secondary mb-4">
          {t('paused.reason', { reason })}
        </Text>
      ) : (
        <View className="mb-4" />
      )}

      <Button
        label={t('paused.resumeEarly')}
        variant="ghost"
        size="md"
        fullWidth
        onPress={() => {
          void resumeStreak({});
        }}
      />
      <Button
        label={t('paused.edit')}
        variant="secondary"
        size="sm"
        fullWidth
        className="mt-2"
        onPress={() => router.push('/pause-streak')}
      />
    </Card>
  );
}
