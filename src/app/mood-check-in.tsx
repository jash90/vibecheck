import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const EMOTIONS = [
  'happy',
  'calm',
  'excited',
  'grateful',
  'motivated',
  'tired',
  'anxious',
  'sad',
  'angry',
  'lonely',
] as const;

const MOOD_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MOOD_EMOJIS = ['😭', '😢', '😞', '😐', '🙂', '🙂', '😊', '😄', '😁', '🤩'];

export default function MoodCheckInScreen() {
  const { t } = useTranslation();
  const logMood = useMutation(api.moodLogs.log);
  const [mood, setMood] = useState<number>(6);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleEmotion(e: string) {
    setSelectedEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await logMood({
        mood,
        emotions: selectedEmotions,
        note: note.trim() || undefined,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      if (mood <= 3) {
        Alert.alert(
          t('mood.lowMoodAlertTitle'),
          t('mood.lowMoodAlertBody'),
          [
            { text: t('common.close'), style: 'cancel', onPress: () => router.back() },
            {
              text: t('mood.openCrisis'),
              onPress: () => router.replace('/crisis-resources'),
            },
          ],
        );
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-6">
        <View className="gap-2 mt-4">
          <Text className="text-3xl font-bold text-foreground">{t('mood.title')}</Text>
          <Text className="text-base text-foreground-secondary">{t('mood.subtitle')}</Text>
        </View>

        <View className="items-center gap-4">
          <Text className="text-7xl">{MOOD_EMOJIS[mood - 1]}</Text>
          <View className="flex-row gap-1.5">
            {MOOD_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => setMood(level)}
                className={cn(
                  'flex-1 h-12 rounded-xl items-center justify-center border',
                  mood === level
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border active:bg-card-elevated',
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    mood === level ? 'text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row justify-between w-full px-1">
            <Text className="text-xs text-foreground-secondary">{t('mood.veryLow')}</Text>
            <Text className="text-xs text-foreground-secondary">{t('mood.veryHigh')}</Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">
            {t('mood.selectEmotions')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const isSelected = selectedEmotions.includes(e);
              return (
                <Pressable
                  key={e}
                  onPress={() => toggleEmotion(e)}
                  className={cn(
                    'px-4 py-2 rounded-pill border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(`mood.emotion.${e}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('mood.noteLabel')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('mood.notePlaceholder')}
            multiline
            numberOfLines={3}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground min-h-[80] focus:border-primary"
          />
        </View>

        <Button
          label={submitting ? t('common.loading') : t('mood.submit')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
          onPress={handleSubmit}
        />
      </ScrollView>
    </Screen>
  );
}
