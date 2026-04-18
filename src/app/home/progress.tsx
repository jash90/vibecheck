import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

import { BadgeCard } from '@features/achievements/components/BadgeCard';
import { SkillTree } from '@features/lifeSkills/components/SkillTree';

export default function ProgressTab() {
  const { t } = useTranslation();
  const achievements = useQuery(api.achievements.listMine);
  const skills = useQuery(api.lifeSkills.listMine);
  const myChallenges = useQuery(api.challenges.listMine);
  const streak = useQuery(api.streaks.getMyStreak);

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-8 gap-4">
        <Text className="text-3xl font-bold text-foreground">{t('progress.title')}</Text>

        <Card elevated>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-foreground-secondary">
                {t('progress.streakFreezes')}
              </Text>
              <Text className="text-3xl font-bold text-foreground mt-1">
                {streak?.freezeTokens ?? 0} / 2
              </Text>
            </View>
            <Text className="text-5xl">❄️</Text>
          </View>
          <Text className="text-xs text-foreground-secondary mt-3">
            {t('progress.streakFreezeHint')}
          </Text>
        </Card>

        <SkillTree skills={skills ?? []} />

        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">
              {t('progress.challengesTitle')}
            </Text>
            <Button
              label={t('common.add')}
              variant="primary"
              size="sm"
              onPress={() => router.push('/challenges')}
            />
          </View>
          {myChallenges === undefined ? (
            <Text className="text-foreground-secondary">{t('common.loading')}</Text>
          ) : myChallenges.length === 0 ? (
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('progress.noChallenges')}
            </Text>
          ) : (
            <View className="gap-2">
              {myChallenges.slice(0, 3).map((c) => (
                <View
                  key={c._id}
                  className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
                >
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {c.title}
                  </Text>
                  <Text className="text-sm text-primary font-semibold">
                    {c.myProgress} / {c.targetPerPerson}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Text className="text-lg font-bold text-foreground mt-2">
          {t('progress.achievementsTitle')}
        </Text>
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
