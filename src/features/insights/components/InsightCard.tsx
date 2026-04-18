import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@shared/ui/Card';

interface InsightCardProps {
  summary: string;
  kind: 'weekly_report' | 'correlation' | 'adulting_tip';
  generatedAt: number;
}

export function InsightCard({ summary, kind, generatedAt }: InsightCardProps) {
  const { t } = useTranslation();
  const icon = kind === 'adulting_tip' ? '💡' : kind === 'correlation' ? '🔗' : '✨';
  const kindLabel = t(`insights.kind.${kind}`);

  return (
    <Card elevated>
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-xl">{icon}</Text>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{kindLabel}</Text>
        </View>
        <View className="px-2 py-0.5 rounded-pill bg-primary/20">
          <Text className="text-[10px] font-bold text-primary">{t('insights.aiLabel')}</Text>
        </View>
      </View>
      <Text className="text-base text-foreground leading-6">{summary}</Text>
      <Text className="text-xs text-foreground-secondary mt-3">
        {t('insights.generated', { when: formatRelative(generatedAt, t) })}
      </Text>
    </Card>
  );
}

type TFn = (_key: string, _params?: Record<string, unknown>) => string;

function formatRelative(ts: number, t: TFn): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return t('insights.daysAgo', { count: days });
  if (hours > 0) return t('insights.hoursAgo', { count: hours });
  if (minutes > 0) return t('insights.minutesAgo', { count: minutes });
  return t('insights.justNow');
}
