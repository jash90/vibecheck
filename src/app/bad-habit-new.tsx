import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import {
  REWARD_TYPES,
  SUBSTITUTE_KEYS,
  type RewardType,
} from '@shared/content/substituteSuggestions';

type Step = 'name' | 'cue' | 'reward' | 'substitute';
const STEPS: Step[] = ['name', 'cue', 'reward', 'substitute'];

const LOCATION_KEYS = [
  'badHabit.cueLoc.bed',
  'badHabit.cueLoc.kitchen',
  'badHabit.cueLoc.desk',
  'badHabit.cueLoc.school',
  'badHabit.cueLoc.phone',
] as const;

const EMOTION_KEYS = [
  'badHabit.cueEmo.bored',
  'badHabit.cueEmo.stressed',
  'badHabit.cueEmo.tired',
  'badHabit.cueEmo.lonely',
  'badHabit.cueEmo.overwhelmed',
] as const;

const MAX_NAME = 80;
const MAX_CUE = 80;
const MAX_REWARD = 280;

export default function BadHabitNewScreen() {
  const { t } = useTranslation();
  const create = useMutation(api.badHabits.create);

  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState('');
  const [cueTime, setCueTime] = useState('');
  const [cueLocation, setCueLocation] = useState<string | null>(null);
  const [cueEmotion, setCueEmotion] = useState<string | null>(null);
  const [cueTrigger, setCueTrigger] = useState('');
  const [rewardType, setRewardType] = useState<RewardType | null>(null);
  const [rewardDescription, setRewardDescription] = useState('');
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const step: Step = STEPS[stepIdx]!;

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function goNext() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }

  function goBack() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else closeScreen();
  }

  function toggleSubstitute(label: string) {
    setSubstitutes((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label].slice(0, 5),
    );
  }

  async function handleFinish() {
    if (!name.trim() || !rewardType || !rewardDescription.trim()) return;
    setSubmitting(true);
    try {
      await create({
        name: name.trim(),
        cueTime: cueTime.trim() || undefined,
        cueLocation: cueLocation ?? undefined,
        cueEmotion: cueEmotion ?? undefined,
        cueTrigger: cueTrigger.trim() || undefined,
        rewardType,
        rewardDescription: rewardDescription.trim(),
        substituteTexts: substitutes,
      });
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed = (() => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'cue') return true;
    if (step === 'reward') return rewardType !== null && rewardDescription.trim().length > 0;
    return true;
  })();

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('badHabit.newTitle')} onClose={closeScreen} />
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

        {step === 'name' ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">
              {t('badHabit.step.nameTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('badHabit.step.nameBody')}
            </Text>
            <TextInput
              value={name}
              onChangeText={(txt) => setName(txt.slice(0, MAX_NAME))}
              placeholder={t('badHabit.step.namePlaceholder')}
              placeholderTextColorClassName="accent-muted"
              cursorColorClassName="accent-primary"
              selectionColorClassName="accent-primary"
              className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
            />
          </View>
        ) : null}

        {step === 'cue' ? (
          <View className="gap-4">
            <Text className="text-xl font-bold text-foreground">
              {t('badHabit.step.cueTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('badHabit.step.cueBody')}
            </Text>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('badHabit.cueTimeLabel')}
              </Text>
              <TextInput
                value={cueTime}
                onChangeText={(txt) => setCueTime(txt.slice(0, MAX_CUE))}
                placeholder={t('badHabit.cueTimePlaceholder')}
                placeholderTextColorClassName="accent-muted"
                cursorColorClassName="accent-primary"
                selectionColorClassName="accent-primary"
                className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('badHabit.cueLocationLabel')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {LOCATION_KEYS.map((k) => {
                  const label = t(k);
                  const isSelected = cueLocation === label;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setCueLocation(isSelected ? null : label)}
                      className={cn(
                        'px-3 py-2 rounded-pill border',
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-border active:bg-card-elevated',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('badHabit.cueEmotionLabel')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EMOTION_KEYS.map((k) => {
                  const label = t(k);
                  const isSelected = cueEmotion === label;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setCueEmotion(isSelected ? null : label)}
                      className={cn(
                        'px-3 py-2 rounded-pill border',
                        isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'bg-card border-border active:bg-card-elevated',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('badHabit.cueTriggerLabel')}
              </Text>
              <TextInput
                value={cueTrigger}
                onChangeText={(txt) => setCueTrigger(txt.slice(0, MAX_CUE))}
                placeholder={t('badHabit.cueTriggerPlaceholder')}
                placeholderTextColorClassName="accent-muted"
                cursorColorClassName="accent-primary"
                selectionColorClassName="accent-primary"
                className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
              />
            </View>
          </View>
        ) : null}

        {step === 'reward' ? (
          <View className="gap-4">
            <Text className="text-xl font-bold text-foreground">
              {t('badHabit.step.rewardTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('badHabit.step.rewardBody')}
            </Text>

            <View className="gap-2">
              {REWARD_TYPES.map((r) => {
                const isSelected = rewardType === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRewardType(r)}
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
                        'text-sm font-semibold',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {t(`badHabit.reward.${r}.title`)}
                    </Text>
                    <Text className="text-xs text-foreground-secondary mt-1">
                      {t(`badHabit.reward.${r}.hint`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t('badHabit.rewardDescLabel')}
              </Text>
              <TextInput
                value={rewardDescription}
                onChangeText={(txt) => setRewardDescription(txt.slice(0, MAX_REWARD))}
                placeholder={t('badHabit.rewardDescPlaceholder')}
                multiline
                placeholderTextColorClassName="accent-muted"
                cursorColorClassName="accent-primary"
                selectionColorClassName="accent-primary"
                className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[80px]"
              />
            </View>
          </View>
        ) : null}

        {step === 'substitute' ? (
          <View className="gap-4">
            <Text className="text-xl font-bold text-foreground">
              {t('badHabit.step.substituteTitle')}
            </Text>
            <Text className="text-sm text-foreground-secondary">
              {t('badHabit.step.substituteBody')}
            </Text>

            {rewardType ? (
              <View className="gap-2">
                {SUBSTITUTE_KEYS[rewardType].map((k) => {
                  const label = t(k);
                  const isSelected = substitutes.includes(label);
                  return (
                    <Pressable
                      key={k}
                      onPress={() => toggleSubstitute(label)}
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
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text className="text-sm text-foreground-secondary italic">
                {t('badHabit.step.substituteEmpty')}
              </Text>
            )}

            <Text className="text-xs text-foreground-secondary">
              {t('badHabit.step.substituteFootnote')}
            </Text>
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
        {step === 'substitute' ? (
          <Button
            label={submitting ? t('common.loading') : t('badHabit.saveCta')}
            variant="primary"
            size="md"
            className="flex-1"
            disabled={submitting || !name.trim() || !rewardType || !rewardDescription.trim()}
            onPress={handleFinish}
          />
        ) : (
          <Button
            label={t('common.continue')}
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!canProceed}
            onPress={goNext}
          />
        )}
      </View>
    </Screen>
  );
}
