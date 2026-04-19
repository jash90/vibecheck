import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ZoomIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const EMOTIONS = [
  { id: 'happy', emoji: '😊' },
  { id: 'calm', emoji: '😌' },
  { id: 'excited', emoji: '🤩' },
  { id: 'grateful', emoji: '🙏' },
  { id: 'motivated', emoji: '💪' },
  { id: 'tired', emoji: '😴' },
  { id: 'anxious', emoji: '😰' },
  { id: 'sad', emoji: '😢' },
  { id: 'angry', emoji: '😠' },
  { id: 'lonely', emoji: '🥺' },
] as const;

const MAX_EMOTIONS = 5;
const MAX_NOTE = 280;
const LOW_MOOD_THRESHOLD = 3;

const MOOD_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const MOOD_EMOJIS = ['😭', '😢', '😞', '😐', '🙂', '🙂', '😊', '😄', '😁', '🤩'];

// Color-graded tints for the rating pills (1 → 10)
const MOOD_TINTS = [
  'bg-danger border-danger',
  'bg-danger/80 border-danger/80',
  'bg-warning border-warning',
  'bg-warning/80 border-warning/80',
  'bg-muted border-muted',
  'bg-primary border-primary',
  'bg-primary border-primary',
  'bg-success/80 border-success/80',
  'bg-success border-success',
  'bg-success border-success',
];

export default function MoodCheckInScreen() {
  const { t } = useTranslation();
  const logMood = useMutation(api.moodLogs.log);
  const [mood, setMood] = useState<number>(6);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLowMoodCard, setShowLowMoodCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onMoodChange(level: number) {
    if (level === mood) return;
    void Haptics.selectionAsync();
    setMood(level);
  }

  function toggleEmotion(id: string) {
    setSelectedEmotions((prev) => {
      if (prev.includes(id)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_EMOTIONS) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return [...prev, id];
    });
  }

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await logMood({
        mood,
        emotions: selectedEmotions,
        note: note.trim() || undefined,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (mood <= LOW_MOOD_THRESHOLD) {
        setShowLowMoodCard(true);
      } else {
        closeScreen();
      }
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectionFull = selectedEmotions.length >= MAX_EMOTIONS;
  const noteRemaining = MAX_NOTE - note.length;

  return (
    <Screen padded={false} safe={false}>
      <ModalHeader title={t('mood.title')} onClose={closeScreen} />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6 gap-8"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{t('mood.title')}</Text>
          <Text className="text-base text-foreground-secondary">{t('mood.subtitle')}</Text>
        </View>

        {/* Mood rating */}
        <View className="items-center gap-5">
          <Animated.Text
            key={mood}
            entering={ZoomIn.duration(220)}
            className="text-7xl leading-[96px] py-2"
          >
            {MOOD_EMOJIS[mood - 1]}
          </Animated.Text>

          <View className="flex-row justify-between w-full">
            {MOOD_LEVELS.map((level) => {
              const isSelected = mood === level;
              return (
                <Pressable
                  key={level}
                  onPress={() => onMoodChange(level)}
                  accessibilityRole="button"
                  accessibilityLabel={String(level)}
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'w-9 h-9 rounded-full items-center justify-center border',
                    isSelected
                      ? MOOD_TINTS[level - 1]
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {level}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row justify-between w-full px-1">
            <Text className="text-xs text-foreground-secondary">{t('mood.veryLow')}</Text>
            <Text className="text-xs text-foreground-secondary">{t('mood.veryHigh')}</Text>
          </View>
        </View>

        {/* Emotions */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">
              {t('mood.selectEmotions')}
            </Text>
            <Text
              className={cn(
                'text-xs font-medium',
                selectionFull ? 'text-primary' : 'text-foreground-secondary',
              )}
            >
              {t('mood.selectedCount', { count: selectedEmotions.length, max: MAX_EMOTIONS })}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const isSelected = selectedEmotions.includes(e.id);
              const isDisabled = !isSelected && selectionFull;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => toggleEmotion(e.id)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                  className={cn(
                    'flex-row items-center gap-1.5 px-3.5 py-2 rounded-pill border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                    isDisabled && 'opacity-40',
                  )}
                >
                  <Text className="text-base">{e.emoji}</Text>
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(`mood.emotion.${e.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">{t('mood.noteLabel')}</Text>
            <Text
              className={cn(
                'text-xs',
                noteRemaining < 20 ? 'text-warning' : 'text-foreground-secondary',
              )}
            >
              {note.length}/{MAX_NOTE}
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('mood.notePlaceholder')}
            multiline
            maxLength={MAX_NOTE}
            numberOfLines={3}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground min-h-[96] focus:border-primary"
          />
          <Text className="text-xs text-foreground-secondary">{t('mood.noteHint')}</Text>
        </View>

        {showLowMoodCard ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition}
            className="rounded-card bg-card-elevated border border-primary/50 p-5 gap-3"
          >
            <View className="flex-row items-center gap-2">
              <Icon name="heart" size={20} colorClassName="accent-primary" />
              <Text className="text-lg font-bold text-foreground">
                {t('mood.lowMoodCardTitle')}
              </Text>
            </View>
            <Text className="text-sm text-foreground-secondary">
              {t('mood.lowMoodAlertBody')}
            </Text>
            <View className="flex-row gap-2 mt-1">
              <Button
                label={t('mood.notNow')}
                variant="secondary"
                size="md"
                onPress={closeScreen}
                className="flex-1"
              />
              <Button
                label={t('mood.openCrisis')}
                variant="primary"
                size="md"
                onPress={() => router.replace('/crisis-resources')}
                className="flex-1"
              />
            </View>
          </Animated.View>
        ) : null}

        {error ? (
          <Text className="text-sm text-danger text-center">{error}</Text>
        ) : null}
      </KeyboardAwareScrollView>

      {/* Sticky footer */}
      {!showLowMoodCard ? (
        <View className="px-6 pt-3 pb-3 border-t border-border/40 bg-background">
          <Button
            label={submitting ? t('mood.submitting') : t('mood.submit')}
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            onPress={handleSubmit}
          />
        </View>
      ) : null}
    </Screen>
  );
}
