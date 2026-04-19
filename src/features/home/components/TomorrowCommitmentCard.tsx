import { Pressable, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { cn } from '@shared/lib/cn';
import type { Id } from '@convex/_generated/dataModel';

interface TomorrowCommitmentCardProps {
  reflectionId: Id<'reflections'>;
  commitmentText: string;
  outcome: 'done' | 'skipped' | 'released' | null;
}

type Outcome = 'done' | 'skipped' | 'released';

const OUTCOMES: Outcome[] = ['done', 'skipped', 'released'];

export function TomorrowCommitmentCard({
  reflectionId,
  commitmentText,
  outcome,
}: TomorrowCommitmentCardProps) {
  const { t } = useTranslation();
  const mark = useMutation(api.reflections.markCommitment);

  return (
    <Card elevated>
      <View className="flex-row items-start gap-2 mb-2">
        <Icon name="sunny-outline" size={18} colorClassName="accent-primary" />
        <Text className="flex-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {t('reflection.yesterdayCommitmentLabel')}
        </Text>
      </View>
      <Text className="text-base text-foreground mb-3">{commitmentText}</Text>
      <View className="flex-row flex-wrap gap-2">
        {OUTCOMES.map((o) => {
          const isSelected = outcome === o;
          return (
            <Pressable
              key={o}
              onPress={() => {
                if (!isSelected) void mark({ reflectionId, outcome: o });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'px-3 py-2 rounded-pill border',
                isSelected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-card border-border active:bg-card-elevated',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {t(`reflection.commitmentOutcome.${o}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
