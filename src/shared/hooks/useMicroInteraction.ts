import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import {
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

type SoundKey = 'tap' | 'complete';
type HapticLevel = 'light' | 'medium' | 'heavy' | 'success' | 'celebration';

const playerCache: Partial<Record<SoundKey, AudioPlayer | null>> = {};

function loadPlayer(key: SoundKey): AudioPlayer | null {
  if (key in playerCache) return playerCache[key] ?? null;
  try {
    const source =
      key === 'tap'
        ? require('../../../assets/sounds/tap.mp3')
        : require('../../../assets/sounds/complete.mp3');
    const player = createAudioPlayer(source);
    playerCache[key] = player;
    return player;
  } catch {
    playerCache[key] = null;
    return null;
  }
}

async function fireHaptic(level: HapticLevel): Promise<void> {
  try {
    switch (level) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'celebration':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 90);
        setTimeout(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 220);
        return;
    }
  } catch {
    // haptics not supported on this platform (e.g. web)
  }
}

function playSound(key: SoundKey): void {
  const player = loadPlayer(key);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // player lost its source or audio session is busy — skip
  }
}

export interface MicroInteractionOptions {
  haptic?: HapticLevel;
  sound?: SoundKey | null;
}

/**
 * Fires haptic + sound for small confirmation taps. Animation is a separate
 * concern — use `usePressBounce` alongside if you want the scale/pulse effect.
 */
export function useMicroInteraction() {
  const trigger = useCallback((opts: MicroInteractionOptions) => {
    if (opts.haptic) void fireHaptic(opts.haptic);
    if (opts.sound) playSound(opts.sound);
  }, []);
  return { trigger };
}

export interface PressBounce {
  scale: SharedValue<number>;
  pulse: SharedValue<number>;
  bounce: () => void;
}

/**
 * Reanimated shared values for a press "confirm" animation:
 * - `scale` shrinks to 0.95 then springs back
 * - `pulse` ramps 0→1→0 for a 450ms color wash overlay
 * Apply `scale` via `transform: [{ scale }]` and `pulse` via opacity on an
 * absolute-positioned overlay with `bg-primary/20`.
 */
export function usePressBounce(): PressBounce {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  const bounce = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withSpring(1, { damping: 8, stiffness: 180 }),
    );
    pulse.value = withSequence(
      withTiming(1, { duration: 110 }),
      withTiming(0, { duration: 350 }),
    );
  }, [scale, pulse]);
  return { scale, pulse, bounce };
}
