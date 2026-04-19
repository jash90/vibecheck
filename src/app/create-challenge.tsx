import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Icon, type IconName } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

type Category = 'mental' | 'physical' | 'sleep' | 'nutrition' | 'mindfulness' | 'hydration' | 'mixed';

const CATEGORIES: { value: Category; icon: IconName; labelKey: string }[] = [
  { value: 'mixed', icon: 'sparkles-outline', labelKey: 'challenge.catMixed' },
  { value: 'mental', icon: 'bulb-outline', labelKey: 'habits.catMental' },
  { value: 'physical', icon: 'walk-outline', labelKey: 'habits.catPhysical' },
  { value: 'sleep', icon: 'moon-outline', labelKey: 'habits.catSleep' },
  { value: 'mindfulness', icon: 'flower-outline', labelKey: 'habits.catMindfulness' },
  { value: 'hydration', icon: 'water-outline', labelKey: 'habits.catHydration' },
  { value: 'nutrition', icon: 'nutrition-outline', labelKey: 'habits.catNutrition' },
];

const DURATION_PRESETS = [7, 14, 30];

export default function CreateChallengeScreen() {
  const { t } = useTranslation();
  const create = useMutation(api.challenges.create);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('mixed');
  const [durationDays, setDurationDays] = useState(7);
  const [targetPerPerson, setTargetPerPerson] = useState(7);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const id = await create({
        title: title.trim(),
        description: description.trim(),
        category,
        durationDays,
        targetPerPerson,
        isPublic,
      });
      router.replace(`/challenge/${id}`);
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false} safe={false}>
      <ModalHeader title={t('challenge.createTitle')} />
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-5">

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('challenge.titleLabel')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('challenge.titlePlaceholder')}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            {t('challenge.descriptionLabel')}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('challenge.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground min-h-[80] focus:border-primary"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.categoryLabel')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => {
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
                  <Icon
                    name={c.icon}
                    size={16}
                    colorClassName={isSelected ? 'accent-primary' : 'accent-foreground'}
                  />
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
          <Text className="text-sm font-medium text-foreground">
            {t('challenge.durationLabel')}
          </Text>
          <View className="flex-row gap-2">
            {DURATION_PRESETS.map((d) => {
              const isSelected = durationDays === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setDurationDays(d);
                    setTargetPerPerson(d);
                  }}
                  className={cn(
                    'flex-1 items-center px-3 py-3 rounded-xl border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t('challenge.days', { count: d })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row items-center gap-3 py-2">
          <View className="flex-1">
            <Text className="text-base text-foreground">{t('challenge.publicLabel')}</Text>
            <Text className="text-xs text-foreground-secondary mt-1">
              {t('challenge.publicHint')}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            thumbColorClassName="accent-white"
            trackColorOnClassName="accent-primary"
            trackColorOffClassName="accent-muted/40"
          />
        </View>

        <Button
          label={submitting ? t('common.loading') : t('challenge.create')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !title.trim()}
          onPress={handleCreate}
        />
      </ScrollView>
    </Screen>
  );
}
