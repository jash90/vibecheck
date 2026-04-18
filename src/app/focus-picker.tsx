import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

type FocusCategory = 'sleep' | 'movement' | 'hydration' | 'mood' | 'mindfulness' | 'nutrition';

const CATEGORIES: { value: FocusCategory; emoji: string; labelKey: string }[] = [
  { value: 'sleep', emoji: '😴', labelKey: 'focusPicker.sleep' },
  { value: 'movement', emoji: '🏃', labelKey: 'focusPicker.movement' },
  { value: 'hydration', emoji: '💧', labelKey: 'focusPicker.hydration' },
  { value: 'mood', emoji: '💜', labelKey: 'focusPicker.mood' },
  { value: 'mindfulness', emoji: '🧘', labelKey: 'focusPicker.mindfulness' },
  { value: 'nutrition', emoji: '🥗', labelKey: 'focusPicker.nutrition' },
];

export default function FocusPickerScreen() {
  const { t } = useTranslation();
  const setFocusCategories = useMutation(api.users.setFocusCategories);
  const [selected, setSelected] = useState<FocusCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggle(cat: FocusCategory) {
    setSelected((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await setFocusCategories({ categories: selected });
      router.replace('/profile-setup');
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 mb-6 gap-2">
        <Text className="text-3xl font-bold text-foreground">{t('focusPicker.title')}</Text>
        <Text className="text-base text-foreground-secondary">{t('focusPicker.subtitle')}</Text>
      </View>

      <View className="flex-row flex-wrap gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.value);
          return (
            <Pressable
              key={cat.value}
              onPress={() => toggle(cat.value)}
              className={cn(
                'flex-1 min-w-[45%] rounded-card p-5 items-center border-2',
                isSelected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-card border-border active:bg-card-elevated',
              )}
            >
              <Text className="text-3xl mb-2">{cat.emoji}</Text>
              <Text
                className={cn(
                  'text-base font-semibold',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <Button
        label={submitting ? t('common.loading') : t('common.continue')}
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || selected.length === 0}
        onPress={handleContinue}
      />
    </Screen>
  );
}
