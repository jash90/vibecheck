import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';
import { templatesForFocus, type HabitTemplate } from '@features/home/habitTemplates';

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  mental: 'habits.catMental',
  physical: 'habits.catPhysical',
  sleep: 'habits.catSleep',
  nutrition: 'habits.catNutrition',
  mindfulness: 'habits.catMindfulness',
  hydration: 'habits.catHydration',
};

const FREQUENCY_LABEL_KEYS: Record<string, string> = {
  daily: 'habits.freqDaily',
  '3x_week': 'habits.freq3xWeek',
  weekly: 'habits.freqWeekly',
};

export default function HabitsTab() {
  const { t } = useTranslation();
  const habits = useQuery(api.habits.listMine);
  const me = useQuery(api.users.me);
  const deactivate = useMutation(api.habits.deactivate);
  const createHabit = useMutation(api.habits.create);

  const suggestions = useMemo<HabitTemplate[]>(() => {
    const focus = me?.focusCategories ?? [];
    const takenNames = new Set((habits ?? []).map((h) => h.name.trim().toLowerCase()));
    return templatesForFocus(focus)
      .filter((tpl) => !takenNames.has(t(`habitTemplates.${tpl.nameKey}`).trim().toLowerCase()))
      .slice(0, 5);
  }, [me?.focusCategories, habits, t]);

  async function handleDelete(id: string) {
    Alert.alert(t('common.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivate({ habitId: id as never });
          } catch (e) {
            Alert.alert(t('common.error'), (e as Error).message);
          }
        },
      },
    ]);
  }

  async function handleAddSuggestion(tpl: HabitTemplate) {
    try {
      await createHabit({
        name: t(`habitTemplates.${tpl.nameKey}`),
        category: tpl.category,
        targetFrequency: tpl.frequency,
        targetValue: tpl.targetValue,
        targetUnit: tpl.targetUnit,
      });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  return (
    <Screen padded={false}>
      <View className="px-6 pt-6 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-foreground">{t('habits.title')}</Text>
        <Pressable
          onPress={() => router.push('/add-habit')}
          accessibilityRole="button"
          accessibilityLabel={t('common.add')}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center rounded-full bg-primary active:bg-primary/80"
        >
          <Icon name="add" size={24} colorClassName="accent-primary-foreground" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8 gap-3"
      >
        <Card onPress={() => router.push('/bad-habits')}>
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center">
              <Icon name="refresh-circle-outline" size={22} colorClassName="accent-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('badHabit.entryTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-0.5">
                {t('badHabit.entryHint')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
          </View>
        </Card>

        {habits === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : habits.length === 0 ? (
          <Card>
            <Text className="text-base text-foreground-secondary text-center py-6">
              {t('habits.empty')}
            </Text>
            <Button
              label={t('habits.addFirst')}
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.push('/add-habit')}
            />
          </Card>
        ) : (
          habits.map((h) => (
            <Card key={h._id}>
              <View className="flex-row items-start gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground">{h.name}</Text>
                  <Text className="text-sm text-foreground-secondary">
                    {t(CATEGORY_LABEL_KEYS[h.category] ?? 'habits.catMental')} ·{' '}
                    {t(FREQUENCY_LABEL_KEYS[h.targetFrequency] ?? 'habits.freqDaily')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(h._id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  hitSlop={8}
                  className="w-10 h-10 items-center justify-center rounded-full active:bg-danger/10"
                >
                  <Icon name="trash-outline" size={20} colorClassName="accent-danger" />
                </Pressable>
              </View>
            </Card>
          ))
        )}

        {suggestions.length > 0 ? (
          <>
            <Text className="text-sm font-semibold text-foreground-secondary mt-4 uppercase tracking-wider">
              {t('habits.suggestionsTitle')}
            </Text>
            {suggestions.map((tpl) => (
              <View
                key={tpl.id}
                className="flex-row items-start gap-3 rounded-card border border-dashed border-border/50 bg-card/30 px-4 py-3"
              >
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground/80">
                    {t(`habitTemplates.${tpl.nameKey}`)}
                  </Text>
                  <Text className="text-sm text-foreground-secondary">
                    {t(CATEGORY_LABEL_KEYS[tpl.category] ?? 'habits.catMental')} ·{' '}
                    {t(FREQUENCY_LABEL_KEYS[tpl.frequency] ?? 'habits.freqDaily')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleAddSuggestion(tpl)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.add')}
                  hitSlop={8}
                  className="w-10 h-10 items-center justify-center rounded-full bg-primary/15 border border-primary/40 active:bg-primary/30"
                >
                  <Icon name="add" size={20} colorClassName="accent-primary" />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
