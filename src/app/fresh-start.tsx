import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import {
  periodForEvent,
  type FreshStartEvent,
} from '@shared/lib/freshStart';

const MAX_COMMITMENT_LENGTH = 160;

type Step = 'identity' | 'habit' | 'commitment';
const STEPS: Step[] = ['identity', 'habit', 'commitment'];

function isFreshStartEvent(value: string | undefined): value is FreshStartEvent {
  return value === 'monday' || value === 'month' || value === 'birthday' || value === 'semester';
}

export default function FreshStartRitualScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ event?: string }>();
  const eventParam = isFreshStartEvent(params.event) ? params.event : 'monday';

  const me = useQuery(api.users.me);
  const habits = useQuery(api.habits.listMine);
  const logCommitment = useMutation(api.commitments.log);

  const [stepIdx, setStepIdx] = useState(0);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [commitmentText, setCommitmentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const step: Step = STEPS[stepIdx]!;

  const identities = useMemo(() => {
    const statements = me?.identityStatements ?? {};
    return Object.entries(statements).map(([cat, text]) => ({ cat, text }));
  }, [me?.identityStatements]);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function handleFinish() {
    if (!commitmentText.trim()) return;
    setSubmitting(true);
    try {
      const { start, end } = periodForEvent(eventParam);
      await logCommitment({
        text: commitmentText.trim(),
        sourceEvent: eventParam,
        periodStart: start,
        periodEnd: end,
        habitId: selectedHabitId ? (selectedHabitId as never) : undefined,
      });
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }

  function goBack() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else closeScreen();
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t(`freshStart.ritual.${eventParam}.title`)} onClose={closeScreen} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-1">
          {STEPS.map((s, i) => (
            <View
              key={s}
              className={cn(
                'flex-1 h-1 rounded-pill',
                i <= stepIdx ? 'bg-primary' : 'bg-border',
              )}
            />
          ))}
        </View>

        {step === 'identity' ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">
              {t('freshStart.step.identityTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('freshStart.step.identityBody')}
            </Text>
            {identities.length === 0 ? (
              <Text className="text-sm text-foreground-secondary italic">
                {t('freshStart.step.identityEmpty')}
              </Text>
            ) : (
              <View className="gap-2">
                {identities.map(({ cat, text }) => (
                  <View
                    key={cat}
                    className="px-4 py-3 rounded-card bg-card border border-border"
                  >
                    <Text className="text-xs font-semibold text-primary uppercase mb-1">
                      {t(`focusPicker.${cat}`)}
                    </Text>
                    <Text className="text-sm text-foreground">{text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {step === 'habit' ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">
              {t('freshStart.step.habitTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('freshStart.step.habitBody')}
            </Text>
            {(habits ?? []).length === 0 ? (
              <Text className="text-sm text-foreground-secondary italic">
                {t('freshStart.step.habitEmpty')}
              </Text>
            ) : (
              <View className="gap-2">
                <Pressable
                  onPress={() => setSelectedHabitId(null)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedHabitId === null }}
                  className={cn(
                    'px-4 py-3 rounded-card border-2',
                    selectedHabitId === null
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      selectedHabitId === null
                        ? 'text-primary font-semibold'
                        : 'text-foreground',
                    )}
                  >
                    {t('freshStart.step.habitNone')}
                  </Text>
                </Pressable>
                {(habits ?? []).map((h) => {
                  const isSelected = selectedHabitId === h._id;
                  return (
                    <Pressable
                      key={h._id}
                      onPress={() => setSelectedHabitId(h._id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className={cn(
                        'px-4 py-3 rounded-card border-2',
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-border active:bg-card-elevated',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm',
                          isSelected ? 'text-primary font-semibold' : 'text-foreground',
                        )}
                      >
                        {h.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {step === 'commitment' ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">
              {t('freshStart.step.commitmentTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('freshStart.step.commitmentBody')}
            </Text>
            <TextInput
              value={commitmentText}
              onChangeText={(txt) =>
                setCommitmentText(txt.slice(0, MAX_COMMITMENT_LENGTH))
              }
              placeholder={t('freshStart.step.commitmentPlaceholder')}
              multiline
              placeholderTextColorClassName="accent-muted"
              cursorColorClassName="accent-primary"
              selectionColorClassName="accent-primary"
              className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[96px]"
            />
          </View>
        ) : null}
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background flex-row gap-2">
        <Button
          label={t(stepIdx === 0 ? 'common.cancel' : 'common.back')}
          variant="ghost"
          size="md"
          onPress={goBack}
        />
        {step === 'commitment' ? (
          <Button
            label={submitting ? t('common.loading') : t('freshStart.saveCta')}
            variant="primary"
            size="md"
            className="flex-1"
            disabled={submitting || commitmentText.trim().length === 0}
            onPress={handleFinish}
          />
        ) : (
          <Button
            label={t('common.continue')}
            variant="primary"
            size="md"
            className="flex-1"
            onPress={goNext}
          />
        )}
      </View>
    </Screen>
  );
}
