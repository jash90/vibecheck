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
  finalizedAt?: number | null;
  myAwardedXp?: number | null;
  myFinalRank?: number | null;
  zenMode?: boolean;
  onPress?: () => void;
}

export function ChallengeCard({
  title,
  description,
  category,
  progress,
  target,
  endsInDays,
  finalizedAt,
  myAwardedXp,
  myFinalRank,
  zenMode = false,
  onPress,
}: ChallengeCardProps) {
  const { t } = useTranslation();
  const percent = progress !== undefined ? Math.min(100, Math.round((progress / target) * 100)) : 0;

  const isFinalized = Boolean(finalizedAt);
  const awarded = myAwardedXp ?? 0;
  const rankLabel =
    myFinalRank === 1
      ? t('challenge.rankFirst')
      : myFinalRank === 2
        ? t('challenge.rankSecond')
        : myFinalRank === 3
          ? t('challenge.rankThird')
          : null;

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
        {isFinalized ? (
          awarded > 0 ? (
            <View className="px-2 py-1 rounded-pill bg-primary/20">
              <Text className="text-xs font-semibold text-primary">
                {zenMode
                  ? rankLabel ?? t('challenge.finished')
                  : `+${awarded} XP${rankLabel ? ` · ${rankLabel}` : ''}`}
              </Text>
            </View>
          ) : (
            <View className="px-2 py-1 rounded-pill bg-card-elevated border border-border">
              <Text className="text-xs font-semibold text-foreground-secondary">
                {t('challenge.noPrize')}
              </Text>
            </View>
          )
        ) : !zenMode ? (
          <View className="px-2 py-1 rounded-pill bg-primary/10 border border-primary/30">
            <Text className="text-xs font-semibold text-primary">{t('challenge.prizePending')}</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2 mb-3">
        <View className="px-2 py-1 rounded-pill bg-card-elevated border border-border">
          <Text className="text-xs font-medium text-foreground-secondary">
            {t(`habits.cat${category.charAt(0).toUpperCase()}${category.slice(1)}`)}
          </Text>
        </View>
        {!isFinalized ? (
          <Text className="text-xs text-foreground-secondary">
            {t('challenge.endsIn', { count: endsInDays })}
          </Text>
        ) : (
          <Text className="text-xs text-foreground-secondary">
            {t('challenge.finished')}
          </Text>
        )}
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
