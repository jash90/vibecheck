import { ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

import { DailyCard } from '@features/home/components/DailyCard';
import { FreshStartBanner } from '@features/home/components/FreshStartBanner';
import { PartnerCard } from '@features/home/components/PartnerCard';
import { PausedCard } from '@features/home/components/PausedCard';
import { TomorrowCommitmentCard } from '@features/home/components/TomorrowCommitmentCard';
import { detectFreshStart } from '@shared/lib/freshStart';
import { EnergyRing } from '@features/home/components/EnergyRing';
import { FocusProgressCard } from '@features/home/components/FocusProgressCard';
import { StreakFlame } from '@features/home/components/StreakFlame';
import { AdultingTipCard } from '@features/insights/components/AdultingTipCard';
import { InsightCard } from '@features/insights/components/InsightCard';

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useQuery(api.users.me);
  const streak = useQuery(api.streaks.getMyStreak);
  const dayScores = useQuery(api.streaks.getDayScores, { days: 7 });
  const latestInsight = useQuery(api.insights.latestForDashboard);
  const weeklyTip = useQuery(api.adultingTips.getThisWeekTip);

  const todayIso = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const yesterdayReflection = useQuery(api.reflections.yesterdaysReflection, {
    today: todayIso,
  });

  const activeDays = (dayScores ?? []).filter((d) => d.habits > 0 || d.mood !== null).length;
  const consistencyScore = activeDays / 7;
  const mentalScore = (dayScores ?? []).some((d) => d.mood !== null)
    ? Math.min(1, ((dayScores ?? []).reduce((acc, d) => acc + (d.mood ?? 0), 0) / 7) / 10)
    : 0;
  const physicalScore = Math.min(1, (streak?.current ?? 0) / 7);

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8 gap-4"
      >
        <View className="flex-row items-center justify-between mt-6">
          <View className="flex-1">
            <Text className="text-sm text-foreground-secondary">
              {t(greetingKey(), { name: user?.username ?? '' }).trim()}
            </Text>
            {user?.zenMode ? null : (
              <Text className="text-lg font-semibold text-foreground mt-1">
                {t('home.level', { level: user?.level ?? 1 })} · {t('home.xp', { xp: user?.xp ?? 0 })}
              </Text>
            )}
          </View>
          <StreakFlame streak={streak?.current ?? 0} />
        </View>

        <Card elevated className="items-center py-6">
          <Text className="text-base font-semibold text-foreground-secondary mb-4">
            {t('home.energyRing')}
          </Text>
          <EnergyRing
            mentalScore={mentalScore}
            physicalScore={physicalScore}
            consistencyScore={consistencyScore}
          />
        </Card>

        <FocusProgressCard />

        <Button
          label={t('home.weeklyReview')}
          variant="ghost"
          size="sm"
          onPress={() => router.push('/weekly-review')}
        />

        {(() => {
          if (user?.freshStartOptIn === false) return null;
          const event = detectFreshStart({
            schoolSemesterDates: user?.schoolSemesterDates ?? null,
          });
          if (!event) return null;
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const alreadyDoneToday =
            user?.lastFreshStartRitualAt != null &&
            user.lastFreshStartRitualAt >= todayStart.getTime();
          if (alreadyDoneToday) return null;
          return (
            <FreshStartBanner event={event} isRebel={user?.tendency === 'rebel'} />
          );
        })()}

        {yesterdayReflection?.tomorrowCommitment ? (
          <TomorrowCommitmentCard
            reflectionId={yesterdayReflection._id}
            commitmentText={yesterdayReflection.tomorrowCommitment}
            outcome={yesterdayReflection.tomorrowCommitmentFulfilled ?? null}
          />
        ) : null}

        {user?.streakPausedUntil && user.streakPausedUntil > Date.now() ? (
          <PausedCard
            until={user.streakPausedUntil}
            reason={user.streakPauseReason}
          />
        ) : (
          <DailyCard />
        )}

        <PartnerCard />

        <Button
          label={t('mood.title')}
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.push('/mood-check-in')}
        />

        {user?.reflectionEnabled && new Date().getHours() >= 19 ? (
          <Button
            label={t('reflection.homeCta')}
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/reflection')}
          />
        ) : null}

        {new Date().getDay() === 0 && new Date().getHours() >= 17 ? (
          <Button
            label={t('brightSpot.homeCta')}
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/bright-spot')}
          />
        ) : null}

        {latestInsight && latestInsight.safetyPassed ? (
          <InsightCard
            summary={latestInsight.summary}
            kind={latestInsight.kind}
            generatedAt={latestInsight.generatedAt}
          />
        ) : null}

        {weeklyTip ? (
          <AdultingTipCard
            id={weeklyTip.id}
            fallbackTitle={weeklyTip.title}
            fallbackBody={weeklyTip.body}
            source={weeklyTip.source}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
