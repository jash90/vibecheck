import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

interface BadgeCardProps {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
}

export function BadgeCard({
  nameKey,
  descriptionKey,
  icon,
  xpReward,
  unlocked,
}: BadgeCardProps) {
  const { t } = useTranslation();
  return (
    <View
      className={cn(
        'flex-1 rounded-card border p-4 items-center gap-2',
        unlocked
          ? 'bg-primary/10 border-primary'
          : 'bg-card border-border',
      )}
    >
      <Text className={cn('text-4xl mb-1', !unlocked && 'opacity-30')}>{icon}</Text>
      <Text
        className={cn(
          'text-sm font-bold text-center',
          unlocked ? 'text-foreground' : 'text-foreground-secondary',
        )}
      >
        {t(nameKey)}
      </Text>
      <Text className="text-xs text-foreground-secondary text-center" numberOfLines={2}>
        {t(descriptionKey)}
      </Text>
      <View className="mt-1 px-2 py-1 rounded-pill bg-background">
        <Text className="text-xs font-semibold text-primary">+{xpReward} XP</Text>
      </View>
    </View>
  );
}
