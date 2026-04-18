import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@shared/ui/Card';
import { cn } from '@shared/lib/cn';

interface ChallengeCardProps {
  title: string;
  description: string;
  category: string;
  progress?: number;
  target: number;
  endsInDays: number;
  xpReward: number;
  onPress?: () => void;
}

export function ChallengeCard({
  title,
  description,
  category,
  progress,
  target,
  endsInDays,
  xpReward,
  onPress,
}: ChallengeCardProps) {
  const { t } = useTranslation();
  const percent = progress !== undefined ? Math.min(100, Math.round((progress / target) * 100)) : 0;

  return (
    <Card onPress={onPress} elevated>
      <View className="flex-row items-start gap-3 mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          <Text
            className="text-xs text-foreground-secondary mt-0.5"
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
        <View className="px-2 py-1 rounded-pill bg-primary/20">
          <Text className="text-xs font-semibold text-primary">+{xpReward} XP</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mb-3">
        <View className="px-2 py-1 rounded-pill bg-card-elevated border border-border">
          <Text className="text-xs font-medium text-foreground-secondary">
            {t(`habits.cat${category.charAt(0).toUpperCase()}${category.slice(1)}`)}
          </Text>
        </View>
        <Text className="text-xs text-foreground-secondary">
          {t('challenge.endsIn', { count: endsInDays })}
        </Text>
      </View>

      {progress !== undefined ? (
        <>
          <View className="h-2 rounded-pill bg-border overflow-hidden">
            <View
              className={cn('h-full bg-primary rounded-pill')}
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="text-xs text-foreground-secondary mt-2">
            {t('challenge.myProgress', { current: progress, target })}
          </Text>
        </>
      ) : null}
    </Card>
  );
}
