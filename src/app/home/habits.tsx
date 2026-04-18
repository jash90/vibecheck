import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

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
  const deactivate = useMutation(api.habits.deactivate);

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

  return (
    <Screen padded={false}>
      <View className="px-6 pt-6 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-foreground">{t('habits.title')}</Text>
        <Button
          label={t('common.add')}
          size="sm"
          variant="primary"
          onPress={() => router.push('/add-habit')}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8 gap-3"
      >
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
                <Button
                  label={t('common.delete')}
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDelete(h._id)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
