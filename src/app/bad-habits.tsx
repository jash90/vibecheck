import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';

export default function BadHabitsListScreen() {
  const { t } = useTranslation();
  const list = useQuery(api.badHabits.listMine);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('badHabit.listTitle')} onClose={closeScreen} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-4"
      >
        <Text className="text-sm text-foreground-secondary">
          {t('badHabit.listBody')}
        </Text>

        {list === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : list.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary text-center py-4">
              {t('badHabit.listEmpty')}
            </Text>
          </Card>
        ) : (
          list.map((b) => (
            <Card key={b._id} onPress={() => router.push(`/bad-habit/${b._id}`)}>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Icon name="refresh-circle-outline" size={22} colorClassName="accent-primary" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{b.name}</Text>
                  <Text className="text-xs text-foreground-secondary mt-0.5">
                    {t(`badHabit.reward.${b.rewardType}.title`)}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
              </View>
            </Card>
          ))
        )}

        <Button
          label={t('badHabit.newCta')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/bad-habit-new')}
        />
      </ScrollView>
    </Screen>
  );
}
