import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { habitCategoryMatchesFocus } from '@shared/constants/focus';

interface CorrelationEntry {
  category: string;
  delta: number | null;
  moodOnActiveDays: number | null;
  moodOnInactiveDays: number | null;
}

interface CorrelationCardProps {
  correlations: CorrelationEntry[];
  focus?: readonly string[] | null;
}

const MIN_MEANINGFUL_DELTA = 0.7;

export function CorrelationCard({ correlations, focus }: CorrelationCardProps) {
  const { t } = useTranslation();
  const ordered = useMemo(() => {
    const filtered = correlations.filter((c) => Math.abs(c.delta ?? 0) >= MIN_MEANINGFUL_DELTA);
    if (!focus || focus.length === 0) return filtered;
    return [...filtered].sort((a, b) => {
      const aMatch = habitCategoryMatchesFocus(a.category, focus) ? 0 : 1;
      const bMatch = habitCategoryMatchesFocus(b.category, focus) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
    });
  }, [correlations, focus]);
  const meaningful = ordered;

  if (meaningful.length === 0) return null;

  return (
    <Card elevated>
      <View className="flex-row items-center gap-2 mb-3">
        <Icon name="link" size={18} colorClassName="accent-primary" />
        <Text className="flex-1 text-sm font-bold text-foreground">
          {t('insights.correlationTitle')}
        </Text>
      </View>
      <View className="gap-2">
        {meaningful.slice(0, 3).map((c) => {
          const delta = c.delta ?? 0;
          const positive = delta > 0;
          return (
            <View
              key={c.category}
              className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
            >
              <Text className="text-base font-semibold text-foreground">
                {t(`habits.cat${c.category.charAt(0).toUpperCase()}${c.category.slice(1)}`)}
              </Text>
              <Text className="flex-1 text-xs text-foreground-secondary">
                {t(positive ? 'insights.correlationPositive' : 'insights.correlationNegative', {
                  delta: Math.abs(delta).toFixed(1),
                })}
              </Text>
              <Text
                className={`text-sm font-bold ${positive ? 'text-success' : 'text-warning'}`}
              >
                {positive ? '+' : '−'}{Math.abs(delta).toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
