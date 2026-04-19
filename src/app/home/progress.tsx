import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

import { CorrelationCard } from '@features/insights/components/CorrelationCard';
import { SkillTree } from '@features/lifeSkills/components/SkillTree';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ProgressTab() {
  const { t } = useTranslation();
  const achievements = useQuery(api.achievements.listMine);
  const skills = useQuery(api.lifeSkills.listMine);
  const myChallenges = useQuery(api.challenges.listMine);
  const streak = useQuery(api.streaks.getMyStreak);
  const correlations = useQuery(api.insights.recentCorrelations, { days: 14 });
  const me = useQuery(api.users.me);
  const logProgress = useMutation(api.challenges.logProgress);

  async function handleLog(challengeId: string) {
    try {
      await logProgress({
        challengeId: challengeId as never,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

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
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <Icon name="snow" size={32} colorClassName="accent-primary" />
            </View>
          </View>
          <Text className="text-xs text-foreground-secondary mt-3">
            {t('progress.streakFreezeHint')}
          </Text>
        </Card>

        {correlations && correlations.length > 0 ? (
          <CorrelationCard correlations={correlations} focus={me?.focusCategories} />
        ) : null}

        <SkillTree skills={skills ?? []} />

        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">
              {t('progress.challengesTitle')}
            </Text>
            <Pressable
              onPress={() => router.push('/challenges')}
              accessibilityRole="button"
              accessibilityLabel={t('common.add')}
              hitSlop={8}
              className="w-9 h-9 items-center justify-center rounded-full bg-primary active:bg-primary/80"
            >
              <Icon name="add" size={20} colorClassName="accent-primary-foreground" />
            </Pressable>
          </View>
          {myChallenges === undefined ? (
            <Text className="text-foreground-secondary">{t('common.loading')}</Text>
          ) : myChallenges.length === 0 ? (
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('progress.noChallenges')}
            </Text>
          ) : (
            <View className="gap-2">
              {myChallenges.slice(0, 3).map((c) => {
                const doneToday = c.myLastLogDate === todayISO();
                const completed = c.myProgress >= c.targetPerPerson;
                return (
                  <Pressable
                    key={c._id}
                    onPress={() => router.push(`/challenge/${c._id}`)}
                    className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0 active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {c.title}
                      </Text>
                      <Text className="text-xs text-foreground-secondary mt-0.5">
                        {c.myProgress} / {c.targetPerPerson}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        if (doneToday || completed) return;
                        void handleLog(c._id);
                      }}
                      disabled={doneToday || completed}
                      accessibilityRole="button"
                      accessibilityLabel={
                        doneToday ? t('challenge.loggedToday') : t('challenge.logToday')
                      }
                      hitSlop={8}
                      className={
                        doneToday || completed
                          ? 'w-9 h-9 items-center justify-center rounded-full bg-success/15 border border-success/40'
                          : 'w-9 h-9 items-center justify-center rounded-full bg-primary/15 border border-primary/40 active:bg-primary/30'
                      }
                    >
                      <Icon
                        name={doneToday || completed ? 'checkmark' : 'checkmark-outline'}
                        size={18}
                        colorClassName={doneToday || completed ? 'accent-success' : 'accent-primary'}
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        <Card onPress={() => router.push('/achievements')}>
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-warning/15 items-center justify-center">
              <Icon name="trophy" size={24} colorClassName="accent-warning" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {t('progress.achievementsTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mt-0.5">
                {achievements === undefined
                  ? t('common.loading')
                  : t('achievements.unlockedCount', {
                      unlocked: achievements.filter((a) => a.unlocked).length,
                      total: achievements.length,
                    })}
              </Text>
            </View>
            <Text className="text-base text-foreground-secondary">→</Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
