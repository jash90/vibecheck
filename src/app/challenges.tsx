import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

import { ChallengeCard } from '@features/challenges/components/ChallengeCard';

function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function ChallengesScreen() {
  const { t } = useTranslation();
  const mine = useQuery(api.challenges.listMine);
  const publicList = useQuery(api.challenges.listActivePublic);

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-8 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-foreground">{t('challenge.title')}</Text>
          <Button
            label={t('challenge.create')}
            variant="primary"
            size="sm"
            onPress={() => router.push('/create-challenge')}
          />
        </View>

        <Text className="text-lg font-bold text-foreground mt-2">{t('challenge.myTitle')}</Text>
        {mine === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : mine.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('progress.noChallenges')}
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {mine.map((c) => (
              <ChallengeCard
                key={c._id}
                title={c.title}
                description={c.description}
                category={c.category}
                progress={c.myProgress}
                target={c.targetPerPerson}
                endsInDays={daysUntil(c.endDate)}
                xpReward={c.xpReward}
                onPress={() => router.push(`/challenge/${c._id}`)}
              />
            ))}
          </View>
        )}

        <Text className="text-lg font-bold text-foreground mt-4">
          {t('challenge.discoverTitle')}
        </Text>
        {publicList === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : publicList.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('challenge.noPublic')}
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {publicList.map((c) => (
              <ChallengeCard
                key={c._id}
                title={c.title}
                description={c.description}
                category={c.category}
                target={c.targetPerPerson}
                endsInDays={daysUntil(c.endDate)}
                xpReward={c.xpReward}
                onPress={() => router.push(`/challenge/${c._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
