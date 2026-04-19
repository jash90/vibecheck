import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';

import { BadgeCard } from '@features/achievements/components/BadgeCard';

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const achievements = useQuery(api.achievements.listMine);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const unlockedCount = (achievements ?? []).filter((a) => a.unlocked).length;
  const total = achievements?.length ?? 0;

  return (
    <Screen padded={false} safe={false}>
      <ModalHeader title={t('achievements.title')} onClose={closeScreen} />

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">{t('achievements.heading')}</Text>
          <Text className="text-sm text-foreground-secondary">
            {t('achievements.subtitle', { unlocked: unlockedCount, total })}
          </Text>
        </View>

        {achievements === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {achievements.map((a) => (
              <View key={a.id} className="w-[48%]">
                <BadgeCard
                  id={a.id}
                  nameKey={a.nameKey}
                  descriptionKey={a.descriptionKey}
                  icon={a.icon}
                  xpReward={a.xpReward}
                  unlocked={a.unlocked}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
