import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import {
  computeTendency,
  type Tendency,
  type TendencyAnswers,
} from '@shared/lib/tendency';

interface QuizOption {
  tendency: Tendency;
  labelKey: string;
}

interface QuizQuestion {
  promptKey: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    promptKey: 'tendency.q1',
    options: [
      { tendency: 'upholder', labelKey: 'tendency.q1.a' },
      { tendency: 'questioner', labelKey: 'tendency.q1.b' },
      { tendency: 'obliger', labelKey: 'tendency.q1.c' },
      { tendency: 'rebel', labelKey: 'tendency.q1.d' },
    ],
  },
  {
    promptKey: 'tendency.q2',
    options: [
      { tendency: 'upholder', labelKey: 'tendency.q2.a' },
      { tendency: 'questioner', labelKey: 'tendency.q2.b' },
      { tendency: 'obliger', labelKey: 'tendency.q2.c' },
      { tendency: 'rebel', labelKey: 'tendency.q2.d' },
    ],
  },
];

export default function TendencyQuizScreen() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = mode === 'edit';

  const setTendency = useMutation(api.users.setTendency);
  const setZenMode = useMutation(api.users.setZenMode);
  const [answers, setAnswers] = useState<TendencyAnswers>([null, null]);
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(questionIndex: number, tendency: Tendency) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = tendency;
      return next;
    });
  }

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function navigateAfterQuiz() {
    if (isEdit) closeScreen();
    else router.replace('/profile-setup');
  }

  function promptRebelZenMode(onContinue: () => void) {
    Alert.alert(
      t('tendency.rebelZenTitle'),
      t('tendency.rebelZenBody'),
      [
        {
          text: t('tendency.rebelZenDecline'),
          style: 'cancel',
          onPress: onContinue,
        },
        {
          text: t('tendency.rebelZenAccept'),
          onPress: async () => {
            try {
              await setZenMode({ zenMode: true });
            } finally {
              onContinue();
            }
          },
        },
      ],
    );
  }

  async function handleSubmit() {
    const result = computeTendency(answers);
    setSubmitting(true);
    try {
      await setTendency({ tendency: result });
      if (result === 'rebel') {
        promptRebelZenMode(() => {
          if (isEdit) {
            Alert.alert(t('tendency.resultTitle'), t(`tendency.result.${result}`), [
              { text: t('common.ok'), onPress: closeScreen },
            ]);
          } else {
            navigateAfterQuiz();
          }
        });
      } else if (isEdit) {
        Alert.alert(t('tendency.resultTitle'), t(`tendency.result.${result}`), [
          { text: t('common.ok'), onPress: closeScreen },
        ]);
      } else {
        navigateAfterQuiz();
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    try {
      await setTendency({ tendency: 'obliger' });
      if (isEdit) closeScreen();
      else router.replace('/profile-setup');
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = answers[0] !== null && answers[1] !== null;

  return (
    <Screen padded={false} safe>
      {isEdit ? <ModalHeader title={t('tendency.title')} onClose={closeScreen} /> : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName={cn('gap-6 pb-6', isEdit ? 'px-6 pt-4' : 'px-6 pt-8')}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{t('tendency.title')}</Text>
          <Text className="text-base text-foreground-secondary">{t('tendency.intro')}</Text>
        </View>

        {QUESTIONS.map((question, qIndex) => (
          <View key={question.promptKey} className="gap-3">
            <Text className="text-base font-semibold text-foreground">
              {t(question.promptKey)}
            </Text>
            <View className="gap-2">
              {question.options.map((option) => {
                const isSelected = answers[qIndex] === option.tendency;
                return (
                  <Pressable
                    key={option.tendency}
                    onPress={() => setAnswer(qIndex, option.tendency)}
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
                      {t(option.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable
          onPress={handleSkip}
          disabled={submitting}
          accessibilityRole="button"
          className="py-2 items-center"
        >
          <Text className="text-sm text-foreground-secondary underline">
            {t('tendency.skip')}
          </Text>
        </Pressable>
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        <Button
          label={
            submitting
              ? t('common.loading')
              : isEdit
                ? t('tendency.saveCta')
                : t('common.continue')
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}
