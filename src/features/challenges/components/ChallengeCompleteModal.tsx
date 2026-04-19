import { useEffect, useMemo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Icon } from '@shared/ui/Icon';
import { cn } from '@shared/lib/cn';

interface ChallengeCompleteModalProps {
  visible: boolean;
  title: string;
  target: number;
  identityStatement?: string | null;
  zenMode?: boolean;
  onClose: () => void;
  onSeeLeaderboard?: () => void;
  onConvertToHabit?: () => void;
}

const CONFETTI_EMOJI = ['🎉', '✨', '⭐', '🎊', '💫'];
const CONFETTI_COUNT = 24;

interface ConfettiSpec {
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function buildConfetti(): ConfettiSpec[] {
  const pieces: ConfettiSpec[] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    pieces.push({
      emoji: CONFETTI_EMOJI[i % CONFETTI_EMOJI.length]!,
      left: Math.round(Math.random() * 100),
      delay: Math.round(Math.random() * 600),
      duration: 1400 + Math.round(Math.random() * 800),
      size: 18 + Math.round(Math.random() * 14),
    });
  }
  return pieces;
}

function ConfettiPiece({ piece }: { piece: ConfettiSpec }) {
  const fall = useSharedValue(-50);
  const drift = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(piece.delay, withTiming(800, { duration: piece.duration }));
    drift.value = withDelay(
      piece.delay,
      withTiming((Math.random() - 0.5) * 80, { duration: piece.duration }),
    );
  }, [fall, drift, piece.delay, piece.duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: fall.value },
      { translateX: drift.value },
      { rotate: `${fall.value * 0.5}deg` },
    ],
    opacity: fall.value < 600 ? 1 : 0,
  }));

  return (
    <Animated.Text
      style={[style, { position: 'absolute', left: `${piece.left}%`, fontSize: piece.size }]}
      pointerEvents="none"
    >
      {piece.emoji}
    </Animated.Text>
  );
}

export function ChallengeCompleteModal({
  visible,
  title,
  target,
  identityStatement,
  zenMode = false,
  onClose,
  onSeeLeaderboard,
  onConvertToHabit,
}: ChallengeCompleteModalProps) {
  const { t } = useTranslation();
  const confetti = useMemo(
    () => (visible && !zenMode ? buildConfetti() : []),
    [visible, zenMode],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
          {confetti.map((p, i) => (
            <ConfettiPiece key={i} piece={p} />
          ))}
        </View>

        <Animated.View
          entering={ZoomIn.duration(280).springify().damping(12)}
          className="w-full max-w-sm bg-card rounded-card p-6 items-center shadow-elevated"
        >
          <View className="w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-4">
            <Icon name="trophy" size={44} colorClassName="accent-primary" />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            {t('challenge.completeTitle')}
          </Text>
          <Text className="text-base text-foreground-secondary text-center mb-1">
            {title}
          </Text>
          <Text className="text-sm text-foreground-secondary text-center mb-2">
            {t(zenMode ? 'challenge.completeBodyZen' : 'challenge.completeBody', {
              count: target,
            })}
          </Text>
          {identityStatement ? (
            <Text className="text-sm font-semibold text-primary text-center mb-5">
              {t('challenge.completeIdentity', { statement: identityStatement })}
            </Text>
          ) : (
            <View className="mb-5" />
          )}

          {onConvertToHabit ? (
            <View className="w-full mb-4 p-3 rounded-card border border-primary/30 bg-primary/5">
              <Text className="text-sm text-foreground text-center mb-2">
                {t('challenge.convertPrompt')}
              </Text>
              <Pressable
                onPress={() => {
                  onConvertToHabit();
                  onClose();
                }}
                accessibilityRole="button"
                className="py-2 rounded-pill bg-primary items-center active:bg-primary/80"
              >
                <Text className="text-sm font-bold text-primary-foreground">
                  {t('challenge.convertCta')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className={cn('w-full flex-row gap-2', !onSeeLeaderboard && 'justify-center')}>
            {onSeeLeaderboard ? (
              <Pressable
                onPress={() => {
                  onSeeLeaderboard();
                  onClose();
                }}
                accessibilityRole="button"
                className="flex-1 py-3 rounded-pill border border-border items-center active:bg-card-elevated"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {t('challenge.seeLeaderboard')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className={cn(
                'py-3 rounded-pill bg-primary items-center active:bg-primary/80',
                onSeeLeaderboard ? 'flex-1' : 'px-8',
              )}
            >
              <Text className="text-sm font-bold text-primary-foreground">
                {t('common.ok')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
