import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

type Category = 'mental' | 'physical' | 'sleep' | 'nutrition' | 'mindfulness' | 'hydration';
type Frequency = 'daily' | '3x_week' | 'weekly';

const CATEGORY_OPTIONS: { value: Category; labelKey: string; emoji: string }[] = [
  { value: 'mental', labelKey: 'habits.catMental', emoji: '🧠' },
  { value: 'physical', labelKey: 'habits.catPhysical', emoji: '🏃' },
  { value: 'sleep', labelKey: 'habits.catSleep', emoji: '😴' },
  { value: 'mindfulness', labelKey: 'habits.catMindfulness', emoji: '🧘' },
  { value: 'hydration', labelKey: 'habits.catHydration', emoji: '💧' },
  { value: 'nutrition', labelKey: 'habits.catNutrition', emoji: '🥗' },
];

const FREQUENCY_OPTIONS: { value: Frequency; labelKey: string }[] = [
  { value: 'daily', labelKey: 'habits.freqDaily' },
  { value: '3x_week', labelKey: 'habits.freq3xWeek' },
  { value: 'weekly', labelKey: 'habits.freqWeekly' },
];

export default function AddHabitScreen() {
  const { t } = useTranslation();
  const createHabit = useMutation(api.habits.create);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('mental');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createHabit({
        name: name.trim(),
        category,
        targetFrequency: frequency,
      });
      router.back();
    } catch (e) {
      const code = (e as { data?: { code?: string } }).data?.code;
      if (code === 'HABIT_LIMIT_FREE_TIER') {
        Alert.alert(t('common.error'), t('habits.freeTierLimit'));
      } else {
        Alert.alert(t('common.error'), (e as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-6">
        <Text className="text-3xl font-bold text-foreground mt-4">{t('habits.addModalTitle')}</Text>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('habits.namePlaceholder')}
            autoCapitalize="sentences"
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.categoryLabel')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => {
              const isSelected = category === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  className={cn(
                    'flex-row items-center gap-2 px-3 py-2 rounded-pill border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text className="text-base">{c.emoji}</Text>
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(c.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.frequencyLabel')}</Text>
          <View className="flex-row gap-2">
            {FREQUENCY_OPTIONS.map((f) => {
              const isSelected = frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  className={cn(
                    'flex-1 items-center px-3 py-3 rounded-xl border',
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
                    {t(f.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          label={submitting ? t('common.loading') : t('common.save')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !name.trim()}
          onPress={handleCreate}
        />
      </ScrollView>
    </Screen>
  );
}
