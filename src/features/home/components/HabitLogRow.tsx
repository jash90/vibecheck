import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Icon } from '@shared/ui/Icon';
import { cn } from '@shared/lib/cn';
import { useMicroInteraction, usePressBounce } from '@shared/hooks/useMicroInteraction';

interface HabitLogRowProps {
  habitId: string;
  name: string;
  done: boolean;
  onLog: (_habitId: string) => void;
  onLogMinimum?: (_habitId: string) => void;
  hasMinimumVersion?: boolean;
  badge: {
    xp: number;
    leveledUp: boolean;
    identityStatement: string | null;
  } | null;
  zenMode?: boolean;
  isStacked?: boolean;
  cueContext?: string | null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HabitLogRowInner({
  habitId,
  name,
  done,
  onLog,
  onLogMinimum,
  hasMinimumVersion = false,
  badge,
  zenMode = false,
  isStacked = false,
  cueContext = null,
}: HabitLogRowProps) {
  const { t } = useTranslation();
  const { trigger } = useMicroInteraction();
  const { scale, pulse, bounce } = usePressBounce();

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View className={cn('relative', isStacked && 'ml-6 mt-1')}>
      <Animated.View style={rowStyle} className="rounded-xl overflow-hidden">
        <AnimatedPressable
          onPress={() => {
            if (done) return;
            trigger({ haptic: 'light', sound: 'tap' });
            bounce();
            onLog(habitId);
          }}
          onLongPress={
            hasMinimumVersion && onLogMinimum && !done
              ? () => {
                  trigger({ haptic: 'medium', sound: 'tap' });
                  onLogMinimum(habitId);
                }
              : undefined
          }
          delayLongPress={350}
          disabled={done}
          className={cn(
            'flex-row items-center gap-3 px-3 py-3 rounded-xl border',
            done
              ? 'bg-success/10 border-success/40'
              : isStacked
                ? 'bg-card border-border/70 active:bg-card-elevated/80'
                : 'bg-card-elevated border-border active:bg-card-elevated/80',
          )}
        >
          {isStacked ? (
            <Icon name="link-outline" size={14} colorClassName="accent-foreground-secondary" />
          ) : null}
          <View
            className={cn(
              'w-6 h-6 rounded-full border-2 items-center justify-center',
              done ? 'bg-success border-success' : 'border-muted',
            )}
          >
            {done ? <Text className="text-white text-xs font-bold">✓</Text> : null}
          </View>
          <View className="flex-1">
            <Text
              className={cn(
                'text-base',
                done ? 'text-foreground-secondary line-through' : 'text-foreground',
              )}
            >
              {name}
            </Text>
            {cueContext && !done ? (
              <Text
                className="text-[11px] text-foreground-secondary mt-0.5"
                numberOfLines={1}
              >
                {cueContext}
              </Text>
            ) : null}
          </View>
        </AnimatedPressable>
        <Animated.View
          pointerEvents="none"
          style={pulseStyle}
          className="absolute inset-0 rounded-xl bg-primary/20"
        />
      </Animated.View>
      {badge && (!zenMode || badge.identityStatement) ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(260)}
          pointerEvents="none"
          className="absolute right-3 -top-3 max-w-[260px] px-3 py-1.5 rounded-card bg-primary shadow-card"
        >
          {!zenMode ? (
            <Text className="text-xs font-bold text-primary-foreground">
              {badge.leveledUp
                ? t('xp.gainedLevelUp', { amount: badge.xp })
                : t('xp.gained', { amount: badge.xp })}
            </Text>
          ) : null}
          {badge.identityStatement ? (
            <Text
              className={cn(
                'font-medium text-primary-foreground',
                zenMode ? 'text-xs' : 'text-[11px] text-primary-foreground/85 mt-0.5',
              )}
              numberOfLines={2}
            >
              {t('xp.voteFor', { statement: badge.identityStatement })}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

export const HabitLogRow = memo(HabitLogRowInner);
HabitLogRow.displayName = 'HabitLogRow';
