import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import { useMicroInteraction } from '@shared/hooks/useMicroInteraction';
import { normalizeCategory } from '@shared/constants/focus';
import { ChallengeCompleteModal } from '@features/challenges/components/ChallengeCompleteModal';

function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000)));
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rankLabelKey(rank: number | null | undefined): string | null {
  if (rank === 1) return 'challenge.rankFirst';
  if (rank === 2) return 'challenge.rankSecond';
  if (rank === 3) return 'challenge.rankThird';
  return null;
}

export default function ChallengeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = id as unknown as never;
  const detail = useQuery(api.challenges.detail, id ? { challengeId } : 'skip');
  const me = useQuery(api.users.me);
  const join = useMutation(api.challenges.join);
  const leave = useMutation(api.challenges.leave);
  const logProgress = useMutation(api.challenges.logProgress);
  const { trigger } = useMicroInteraction();
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  if (!id) {
    return (
      <Screen>
        <Text className="text-foreground">{t('common.error')}</Text>
      </Screen>
    );
  }

  if (detail === undefined) {
    return (
      <Screen>
        <Text className="text-foreground-secondary">{t('common.loading')}</Text>
      </Screen>
    );
  }

  if (detail === null) {
    return (
      <Screen>
        <Text className="text-foreground">{t('challenge.notFound')}</Text>
      </Screen>
    );
  }

  const percent = Math.min(
    100,
    Math.round((detail.myProgress / detail.targetPerPerson) * 100),
  );
  const collectiveProgress = detail.participants.reduce((acc, p) => acc + p.progress, 0);
  const collectiveTarget = detail.targetPerPerson * detail.participants.length;
  const collectivePercent = collectiveTarget > 0
    ? Math.round((collectiveProgress / collectiveTarget) * 100)
    : 0;

  const isFinalized = Boolean(detail.finalizedAt);
  const participantCount = detail.participants.length;
  const myRankKey = rankLabelKey(detail.myFinalRank ?? null);
  const zenMode = me?.zenMode ?? false;

  const leaderboard = [...detail.participants].sort((a, b) => {
    const ra = a.finalRank ?? Number.POSITIVE_INFINITY;
    const rb = b.finalRank ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return b.progress - a.progress;
  });

  return (
    <Screen padded={false}>
      <ModalHeader title={detail.title} icon="chevron-back" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-8 gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{detail.title}</Text>
          <Text className="text-base text-foreground-secondary">{detail.description}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="px-2 py-1 rounded-pill bg-card border border-border">
              <Text className="text-xs font-medium text-foreground">
                {isFinalized
                  ? t('challenge.finished')
                  : t('challenge.endsIn', { count: daysUntil(detail.endDate) })}
              </Text>
            </View>
            {isFinalized ? (
              detail.myAwardedXp != null && detail.myAwardedXp > 0 ? (
                <View className="px-2 py-1 rounded-pill bg-primary/20">
                  <Text className="text-xs font-semibold text-primary">
                    {zenMode
                      ? myRankKey
                        ? t(myRankKey)
                        : t('challenge.finished')
                      : `+${detail.myAwardedXp} XP${myRankKey ? ` · ${t(myRankKey)}` : ''}`}
                  </Text>
                </View>
              ) : detail.amIJoined ? (
                <View className="px-2 py-1 rounded-pill bg-card-elevated border border-border">
                  <Text className="text-xs font-semibold text-foreground-secondary">
                    {t('challenge.noPrize')}
                  </Text>
                </View>
              ) : null
            ) : !zenMode ? (
              <View className="px-2 py-1 rounded-pill bg-primary/10 border border-primary/30">
                <Text className="text-xs font-semibold text-primary">
                  {t('challenge.prizePending')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {isFinalized &&
        detail.amIJoined &&
        (detail.myAwardedXp ?? 0) === 0 &&
        leaderboard.some((p) => (p.awardedXp ?? 0) > 0) ? (
          <Card elevated>
            <Text className="text-sm text-foreground leading-relaxed">
              {t('challenge.noPrizeMessage')}
            </Text>
          </Card>
        ) : null}

        {!isFinalized && !zenMode ? (
          <Card>
            <Text className="text-base font-bold text-foreground mb-2">
              {t('challenge.prizeStructureTitle')}
            </Text>
            {participantCount <= 1 ? (
              <Text className="text-sm text-foreground-secondary">
                {t('challenge.prizeStructureSolo')}
              </Text>
            ) : participantCount === 2 ? (
              <Text className="text-sm text-foreground-secondary">
                {t('challenge.prizeStructureDuo')}
              </Text>
            ) : (
              <View className="gap-1">
                <Text className="text-sm text-foreground-secondary">
                  {t('challenge.prizeStructureGroup1')}
                </Text>
                <Text className="text-sm text-foreground-secondary">
                  {t('challenge.prizeStructureGroup2')}
                </Text>
                <Text className="text-sm text-foreground-secondary">
                  {t('challenge.prizeStructureGroup3')}
                </Text>
              </View>
            )}
            <Text className="text-xs text-foreground-secondary mt-2">
              {t('challenge.prizeStructureHint')}
            </Text>
          </Card>
        ) : null}

        {detail.amIJoined ? (
          <Card elevated>
            <Text className="text-sm font-semibold text-foreground-secondary mb-2">
              {t('challenge.myProgress', {
                current: detail.myProgress,
                target: detail.targetPerPerson,
              })}
            </Text>
            <View className="h-3 rounded-pill bg-border overflow-hidden">
              <View
                className={cn('h-full bg-primary rounded-pill')}
                style={{ width: `${percent}%` }}
              />
            </View>
            {!isFinalized ? (
              <>
                <View className="mt-4 flex-row gap-2">
                  {detail.myLastLogDate === todayISO() ? (
                    <Button
                      label={t('challenge.loggedToday')}
                      variant="secondary"
                      size="md"
                      fullWidth
                      disabled
                    />
                  ) : (
                    <Button
                      label={t('challenge.logToday')}
                      variant="primary"
                      size="md"
                      fullWidth
                      onPress={async () => {
                        trigger({ haptic: 'medium', sound: 'tap' });
                        try {
                          const result = await logProgress({
                            challengeId,
                            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
                          });
                          if (result.justCompleted) {
                            trigger({ haptic: 'celebration', sound: 'complete' });
                            setCompleteModalOpen(true);
                          }
                        } catch (e) {
                          Alert.alert(t('common.error'), (e as Error).message);
                        }
                      }}
                    />
                  )}
                </View>
                <Button
                  label={t('challenge.leave')}
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="mt-2"
                  onPress={() => {
                    Alert.alert(t('challenge.leave'), t('challenge.leaveConfirm'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('challenge.leave'),
                        style: 'destructive',
                        onPress: async () => {
                          await leave({ challengeId });
                          router.back();
                        },
                      },
                    ]);
                  }}
                />
              </>
            ) : null}
          </Card>
        ) : !isFinalized ? (
          <Button
            label={t('challenge.join')}
            variant="primary"
            size="lg"
            fullWidth
            onPress={async () => {
              try {
                await join({ challengeId });
              } catch (e) {
                Alert.alert(t('common.error'), (e as Error).message);
              }
            }}
          />
        ) : null}

        <Card>
          <Text className="text-base font-bold text-foreground mb-2">
            {t('challenge.collective')}
          </Text>
          <Text className="text-xs text-foreground-secondary mb-3">
            {collectiveProgress} / {collectiveTarget}
          </Text>
          <View className="h-3 rounded-pill bg-border overflow-hidden">
            <View
              className={cn('h-full bg-accent rounded-pill')}
              style={{ width: `${collectivePercent}%` }}
            />
          </View>
        </Card>

        <Card>
          <Text className="text-base font-bold text-foreground mb-3">
            {isFinalized ? t('challenge.leaderboard') : t('challenge.participants')}
          </Text>
          <View className="gap-2">
            {leaderboard.map((p) => {
              const rankKey = rankLabelKey(p.finalRank ?? null);
              return (
                <View
                  key={p.userId}
                  className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
                >
                  <View className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center">
                    <Icon name="person" size={18} colorClassName="accent-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-foreground">{p.username ?? '—'}</Text>
                    {isFinalized && rankKey ? (
                      <Text className="text-xs text-primary font-semibold">
                        {t(rankKey)}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-sm text-foreground-secondary font-semibold">
                    {p.progress} / {detail.targetPerPerson}
                  </Text>
                  {isFinalized && !zenMode && p.awardedXp != null && p.awardedXp > 0 ? (
                    <View className="px-2 py-1 rounded-pill bg-primary/20">
                      <Text className="text-xs font-semibold text-primary">
                        +{p.awardedXp}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
          {isFinalized && leaderboard.every((p) => (p.awardedXp ?? 0) === 0) ? (
            <Text className="text-xs text-foreground-secondary mt-3 text-center">
              {t('challenge.noWinners')}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
      <ChallengeCompleteModal
        visible={completeModalOpen}
        title={detail.title}
        target={detail.targetPerPerson}
        identityStatement={
          me?.identityStatements
            ? me.identityStatements[normalizeCategory(detail.category)] ?? null
            : null
        }
        zenMode={zenMode}
        onClose={() => setCompleteModalOpen(false)}
        onConvertToHabit={
          !detail.convertedToHabitId
            ? () =>
                router.push({
                  pathname: '/add-habit',
                  params: {
                    prefillName: detail.title,
                    prefillCategory: detail.category,
                    convertFromChallengeId: detail._id,
                  },
                })
            : undefined
        }
      />
    </Screen>
  );
}
