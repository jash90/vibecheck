import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { habitCategoryMatchesFocus } from '@shared/constants/focus';

import {
  challengeTemplatesForFocus,
  type ChallengeTemplate,
} from '@features/challenges/challengeTemplates';
import { ChallengeCard } from '@features/challenges/components/ChallengeCard';

function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function ChallengesScreen() {
  const { t } = useTranslation();
  const mine = useQuery(api.challenges.listMine);
  const publicList = useQuery(api.challenges.listActivePublic);
  const me = useQuery(api.users.me);
  const createChallenge = useMutation(api.challenges.create);

  const sortedPublic = useMemo(() => {
    if (!publicList) return publicList;
    const focus = me?.focusCategories ?? [];
    if (focus.length === 0) return publicList;
    return [...publicList].sort((a, b) => {
      const aMatch = habitCategoryMatchesFocus(a.category, focus) ? 0 : 1;
      const bMatch = habitCategoryMatchesFocus(b.category, focus) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.endDate - b.endDate;
    });
  }, [publicList, me?.focusCategories]);

  const suggestions = useMemo<ChallengeTemplate[]>(() => {
    const focus = me?.focusCategories ?? [];
    const takenTitles = new Set((mine ?? []).map((c) => c.title.trim().toLowerCase()));
    return challengeTemplatesForFocus(focus)
      .filter(
        (tpl) =>
          !takenTitles.has(t(`challengeTemplates.${tpl.key}.title`).trim().toLowerCase()),
      )
      .slice(0, 4);
  }, [me?.focusCategories, mine, t]);

  async function handleAddSuggestion(tpl: ChallengeTemplate) {
    try {
      const id = await createChallenge({
        title: t(`challengeTemplates.${tpl.key}.title`),
        description: t(`challengeTemplates.${tpl.key}.description`),
        category: tpl.category,
        durationDays: tpl.durationDays,
        targetPerPerson: tpl.targetPerPerson,
        isPublic: false,
      });
      router.push(`/challenge/${id}`);
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  return (
    <Screen padded={false}>
      <ModalHeader title={t('challenge.title')} icon="chevron-back" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-3 pb-8 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">{t('challenge.myTitle')}</Text>
          <Pressable
            onPress={() => router.push('/create-challenge')}
            accessibilityRole="button"
            accessibilityLabel={t('challenge.create')}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center rounded-full bg-primary active:bg-primary/80"
          >
            <Icon name="add" size={20} colorClassName="accent-primary-foreground" />
          </Pressable>
        </View>
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
                finalizedAt={c.finalizedAt ?? null}
                myAwardedXp={c.myAwardedXp}
                myFinalRank={c.myFinalRank}
                zenMode={me?.zenMode ?? false}
                onPress={() => router.push(`/challenge/${c._id}`)}
              />
            ))}
          </View>
        )}

        {suggestions.length > 0 ? (
          <>
            <Text className="text-sm font-semibold text-foreground-secondary mt-4 uppercase tracking-wider">
              {t('challenge.suggestionsTitle')}
            </Text>
            {suggestions.map((tpl) => (
              <View
                key={tpl.id}
                className="flex-row items-start gap-3 rounded-card border border-dashed border-border/50 bg-card/30 px-4 py-3"
              >
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground/80">
                    {t(`challengeTemplates.${tpl.key}.title`)}
                  </Text>
                  <Text className="text-xs text-foreground-secondary" numberOfLines={2}>
                    {t(`challengeTemplates.${tpl.key}.description`)}
                  </Text>
                  <Text className="text-xs text-foreground-secondary mt-1">
                    {t('challenge.days', { count: tpl.durationDays })} · {tpl.targetPerPerson}×
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

        <Text className="text-lg font-bold text-foreground mt-4">
          {t('challenge.discoverTitle')}
        </Text>
        {sortedPublic === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : sortedPublic.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary py-3 text-center">
              {t('challenge.noPublic')}
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {sortedPublic.map((c) => (
              <ChallengeCard
                key={c._id}
                title={c.title}
                description={c.description}
                category={c.category}
                target={c.targetPerPerson}
                endsInDays={daysUntil(c.endDate)}
                finalizedAt={c.finalizedAt ?? null}
                zenMode={me?.zenMode ?? false}
                onPress={() => router.push(`/challenge/${c._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
