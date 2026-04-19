import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon, type IconName } from '@shared/ui/Icon';
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

export function FocusProgressCard() {
  const { t } = useTranslation();
  const data = useQuery(api.focusProgress.weeklyByFocus);

  if (!data || data.buckets.length === 0) return null;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-foreground">
          {t('home.focusProgressTitle')}
        </Text>
        <Text className="text-xs text-foreground-secondary">{t('home.thisWeek')}</Text>
      </View>
      <View className="flex-row gap-3 justify-between">
        {data.buckets.map((b) => (
          <FocusRing
            key={b.focus}
            label={t(FOCUS_LABELS[b.focus as FocusCategory])}
            icon={FOCUS_ICONS[b.focus as FocusCategory]}
            score={b.score}
            activeDays={b.activeDays}
            hasHabits={b.habitCount > 0}
          />
        ))}
      </View>
      {data.buckets.some((b) => b.habitCount === 0) ? (
        <Text className="text-xs text-foreground-secondary mt-3">
          {t('home.focusProgressEmptyHint')}
        </Text>
      ) : null}
    </Card>
  );
}

interface FocusRingProps {
  label: string;
  icon: IconName;
  score: number;
  activeDays: number;
  hasHabits: boolean;
}

function FocusRing({ label, icon, score, activeDays, hasHabits }: FocusRingProps) {
  const pct = Math.min(100, Math.round(score * 100));
  const tint = !hasHabits
    ? 'bg-muted/30'
    : pct >= 70
      ? 'bg-success/30'
      : pct >= 40
        ? 'bg-primary/30'
        : 'bg-warning/30';
  const iconTint = !hasHabits
    ? 'accent-muted'
    : pct >= 70
      ? 'accent-success'
      : pct >= 40
        ? 'accent-primary'
        : 'accent-warning';

  return (
    <View className="flex-1 items-center gap-1.5">
      <View className={cn('w-14 h-14 rounded-full items-center justify-center', tint)}>
        <Icon name={icon} size={24} colorClassName={iconTint} />
      </View>
      <Text className="text-sm font-bold text-foreground">{activeDays}/7</Text>
      <Text
        className="text-[11px] text-foreground-secondary text-center"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
