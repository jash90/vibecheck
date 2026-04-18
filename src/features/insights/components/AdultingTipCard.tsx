import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@shared/ui/Card';

interface AdultingTipCardProps {
  title: string;
  body: string;
}

export function AdultingTipCard({ title, body }: AdultingTipCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-xl">💡</Text>
        <Text className="flex-1 text-sm font-bold text-foreground">
          {t('insights.adultingWeekly')}
        </Text>
      </View>
      <Text className="text-base font-semibold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-foreground-secondary leading-5">{body}</Text>
    </Card>
  );
}
