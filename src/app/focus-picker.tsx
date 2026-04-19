import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Icon, type IconName } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

type FocusCategory = 'sleep' | 'movement' | 'hydration' | 'mood' | 'mindfulness' | 'nutrition';

const CATEGORIES: { value: FocusCategory; icon: IconName; labelKey: string }[] = [
  { value: 'sleep', icon: 'moon-outline', labelKey: 'focusPicker.sleep' },
  { value: 'movement', icon: 'walk-outline', labelKey: 'focusPicker.movement' },
  { value: 'hydration', icon: 'water-outline', labelKey: 'focusPicker.hydration' },
  { value: 'mood', icon: 'heart-outline', labelKey: 'focusPicker.mood' },
  { value: 'mindfulness', icon: 'flower-outline', labelKey: 'focusPicker.mindfulness' },
  { value: 'nutrition', icon: 'nutrition-outline', labelKey: 'focusPicker.nutrition' },
];

export default function FocusPickerScreen() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = mode === 'edit';

  const setFocusCategories = useMutation(api.users.setFocusCategories);
  const me = useQuery(api.users.me, isEdit ? {} : 'skip');

  const [selected, setSelected] = useState<FocusCategory[]>([]);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || hydrated) return;
    if (me?.focusCategories) {
      setSelected(me.focusCategories as FocusCategory[]);
      setHydrated(true);
    }
  }, [isEdit, hydrated, me]);

  function toggle(cat: FocusCategory) {
    setSelected((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  }

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await setFocusCategories({ categories: selected });
      if (isEdit) {
        closeScreen();
      } else {
        router.replace('/identity-picker');
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = isEdit ? t('focusPicker.editTitle') : t('focusPicker.title');
  const subtitle = isEdit ? t('focusPicker.editSubtitle') : t('focusPicker.subtitle');
  const cta = isEdit
    ? submitting
      ? t('common.loading')
      : t('focusPicker.saveChanges')
    : submitting
      ? t('common.loading')
      : t('common.continue');

  return (
    <Screen padded={false} safe>
      {isEdit ? <ModalHeader title={t('profile.editGoals')} onClose={closeScreen} /> : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName={cn(
          'gap-6 pb-6',
          isEdit ? 'px-6 pt-4' : 'px-6 pt-8',
        )}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{title}</Text>
          <Text className="text-base text-foreground-secondary">{subtitle}</Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
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
                <Icon
                  name={cat.icon}
                  size={32}
                  colorClassName={isSelected ? 'accent-primary' : 'accent-foreground'}
                  className="mb-2"
                />
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
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        <Button
          label={cta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || selected.length === 0}
          onPress={handleContinue}
        />
      </View>
    </Screen>
  );
}
