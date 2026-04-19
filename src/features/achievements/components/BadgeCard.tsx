import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@shared/ui/Icon';
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
        unlocked ? 'bg-primary/10 border-primary' : 'bg-card border-border',
      )}
    >
      <View
        className={cn(
          'w-14 h-14 rounded-full items-center justify-center mb-1',
          unlocked ? 'bg-primary/20' : 'bg-card-elevated',
        )}
      >
        <Icon
          name={icon as IconName}
          size={28}
          colorClassName={unlocked ? 'accent-primary' : 'accent-muted'}
        />
      </View>
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
