import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Icon, type IconName } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import { normalizeCategory, type FocusCategory } from '@shared/constants/focus';
import { pickTipForCategory } from '@shared/content/environmentTips';
import {
  type HabitTemplate,
  templatesForFocus,
} from '@features/home/habitTemplates';

type Category = 'mental' | 'physical' | 'sleep' | 'nutrition' | 'mindfulness' | 'hydration';
type Frequency = 'daily' | '3x_week' | 'weekly';

const MAX_CUE_LENGTH = 140;
const MAX_COPING_LENGTH = 140;
const MAX_MINIMUM_LENGTH = 100;

const CUE_TEMPLATE_KEYS = [
  'cueTemplate.morningTeeth',
  'cueTemplate.afterSchool',
  'cueTemplate.beforeLeaving',
  'cueTemplate.beforeBed',
  'cueTemplate.firstWater',
  'cueTemplate.sittingDesk',
] as const;

const COPING_TEMPLATE_KEYS = [
  'copingTemplate.tiredMini',
  'copingTemplate.travelSwap',
  'copingTemplate.morningBackup',
] as const;

const MINIMUM_TEMPLATE_KEYS = [
  'minimumTemplate.puttOnShoes',
  'minimumTemplate.oneSentence',
  'minimumTemplate.threeBreaths',
  'minimumTemplate.oneGlass',
] as const;

const CATEGORY_OPTIONS: { value: Category; labelKey: string; icon: IconName }[] = [
  { value: 'mental', labelKey: 'habits.catMental', icon: 'bulb-outline' },
  { value: 'physical', labelKey: 'habits.catPhysical', icon: 'walk-outline' },
  { value: 'sleep', labelKey: 'habits.catSleep', icon: 'moon-outline' },
  { value: 'mindfulness', labelKey: 'habits.catMindfulness', icon: 'flower-outline' },
  { value: 'hydration', labelKey: 'habits.catHydration', icon: 'water-outline' },
  { value: 'nutrition', labelKey: 'habits.catNutrition', icon: 'nutrition-outline' },
];

const FREQUENCY_OPTIONS: { value: Frequency; labelKey: string }[] = [
  { value: 'daily', labelKey: 'habits.freqDaily' },
  { value: '3x_week', labelKey: 'habits.freq3xWeek' },
  { value: 'weekly', labelKey: 'habits.freqWeekly' },
];

function isCategory(value: string | undefined): value is Category {
  return (
    value === 'mental' ||
    value === 'physical' ||
    value === 'sleep' ||
    value === 'nutrition' ||
    value === 'mindfulness' ||
    value === 'hydration'
  );
}

export default function AddHabitScreen() {
  const { t } = useTranslation();
  const createHabit = useMutation(api.habits.create);
  const markConverted = useMutation(api.challenges.markConvertedToHabit);
  const me = useQuery(api.users.me);
  const myHabits = useQuery(api.habits.listMine);

  const params = useLocalSearchParams<{
    prefillName?: string;
    prefillCategory?: string;
    convertFromChallengeId?: string;
  }>();

  const [name, setName] = useState(params.prefillName ?? '');
  const [category, setCategory] = useState<Category>(
    isCategory(params.prefillCategory) ? params.prefillCategory : 'mental',
  );
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [targetValue, setTargetValue] = useState<number | undefined>();
  const [targetUnit, setTargetUnit] = useState<string | undefined>();
  const [cueContext, setCueContext] = useState('');
  const [copingPlan, setCopingPlan] = useState('');
  const [parentHabitId, setParentHabitId] = useState<string | undefined>(undefined);
  const [minimumVersion, setMinimumVersion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const templates = templatesForFocus(me?.focusCategories).slice(0, 6);
  const stackCandidates = myHabits ?? [];
  const setEnvExperiment = useMutation(api.users.setEnvironmentExperiment);
  const suggestedTip = pickTipForCategory(normalizeCategory(category) as FocusCategory);
  const suggestedTipActive = (me?.environmentExperiments ?? []).some(
    (e) => e.tipId === suggestedTip?.id,
  );

  function applyTemplate(tpl: HabitTemplate) {
    setName(t(`habitTemplates.${tpl.nameKey}`));
    setCategory(tpl.category);
    setFrequency(tpl.frequency);
    setTargetValue(tpl.targetValue);
    setTargetUnit(tpl.targetUnit);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const habitId = await createHabit({
        name: name.trim(),
        category,
        targetFrequency: frequency,
        targetValue,
        targetUnit: targetUnit as 'min' | 'glass' | 'step' | 'page' | 'meal' | undefined,
        cueContext: cueContext.trim() || undefined,
        copingPlan: copingPlan.trim() || undefined,
        stackedAfterHabitId: parentHabitId as never,
        minimumVersion: minimumVersion.trim() || undefined,
      });
      if (params.convertFromChallengeId) {
        try {
          await markConverted({
            challengeId: params.convertFromChallengeId as never,
            habitId,
          });
        } catch {
          // conversion link is best-effort — habit creation already succeeded
        }
      }
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('habits.addModalTitle')} />
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-6">

        {templates.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              {t('habits.templatesLabel')}
            </Text>
            <Text className="text-xs text-foreground-secondary">
              {t('habits.templatesHint')}
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-1">
              {templates.map((tpl) => (
                <Pressable
                  key={tpl.id}
                  onPress={() => applyTemplate(tpl)}
                  className="px-3 py-2 rounded-pill bg-primary/10 border border-primary/30 active:bg-primary/20"
                >
                  <Text className="text-sm font-medium text-primary">
                    {t(`habitTemplates.${tpl.nameKey}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('habits.namePlaceholder')}
            autoCapitalize="sentences"
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.categoryLabel')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => {
              const isSelected = category === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  className={cn(
                    'flex-row items-center gap-2 px-3 py-2 rounded-pill border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Icon
                    name={c.icon}
                    size={18}
                    colorClassName={isSelected ? 'accent-primary' : 'accent-foreground'}
                  />
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(c.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.frequencyLabel')}</Text>
          <View className="flex-row gap-2">
            {FREQUENCY_OPTIONS.map((f) => {
              const isSelected = frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  className={cn(
                    'flex-1 items-center px-3 py-3 rounded-xl border',
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-card border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(f.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.targetLabel')}</Text>
          <Text className="text-xs text-foreground-secondary">{t('habits.targetHint')}</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={targetValue?.toString() ?? ''}
              onChangeText={(v) => {
                const n = Number(v);
                setTargetValue(Number.isFinite(n) && n > 0 ? n : undefined);
              }}
              placeholder={t('habits.targetValuePlaceholder')}
              keyboardType="number-pad"
              placeholderTextColorClassName="accent-muted"
              cursorColorClassName="accent-primary"
              selectionColorClassName="accent-primary"
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
            />
            <View className="flex-row gap-1 flex-wrap">
              {(['min', 'glass', 'step', 'page', 'meal'] as const).map((u) => {
                const isSelected = targetUnit === u;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setTargetUnit(isSelected ? undefined : u)}
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
                      {t(`habits.unit.${u}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.cueLabel')}</Text>
          <Text className="text-xs text-foreground-secondary">{t('habits.cueHint')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {CUE_TEMPLATE_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setCueContext(t(key))}
                className="px-3 py-2 rounded-pill bg-card border border-border active:bg-card-elevated"
              >
                <Text className="text-xs font-medium text-foreground">{t(key)}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={cueContext}
            onChangeText={(txt) => setCueContext(txt.slice(0, MAX_CUE_LENGTH))}
            placeholder={t('habits.cuePlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('habits.copingLabel')}</Text>
          <Text className="text-xs text-foreground-secondary">{t('habits.copingHint')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {COPING_TEMPLATE_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setCopingPlan(t(key))}
                className="px-3 py-2 rounded-pill bg-card border border-border active:bg-card-elevated"
              >
                <Text className="text-xs font-medium text-foreground">{t(key)}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={copingPlan}
            onChangeText={(txt) => setCopingPlan(txt.slice(0, MAX_COPING_LENGTH))}
            placeholder={t('habits.copingPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        {stackCandidates.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              {t('habits.stackLabel')}
            </Text>
            <Text className="text-xs text-foreground-secondary">{t('habits.stackHint')}</Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setParentHabitId(undefined)}
                className={cn(
                  'px-3 py-2 rounded-pill border',
                  parentHabitId === undefined
                    ? 'bg-primary/20 border-primary'
                    : 'bg-card border-border active:bg-card-elevated',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-medium',
                    parentHabitId === undefined ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {t('habits.stackNone')}
                </Text>
              </Pressable>
              {stackCandidates.map((h) => {
                const isSelected = parentHabitId === h._id;
                return (
                  <Pressable
                    key={h._id}
                    onPress={() => setParentHabitId(h._id)}
                    className={cn(
                      'px-3 py-2 rounded-pill border flex-row items-center gap-1',
                      isSelected
                        ? 'bg-primary/20 border-primary'
                        : 'bg-card border-border active:bg-card-elevated',
                    )}
                  >
                    <Icon
                      name="link-outline"
                      size={14}
                      colorClassName={isSelected ? 'accent-primary' : 'accent-foreground'}
                    />
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {h.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            {t('habits.minimumLabel')}
          </Text>
          <Text className="text-xs text-foreground-secondary">{t('habits.minimumHint')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {MINIMUM_TEMPLATE_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setMinimumVersion(t(key))}
                className="px-3 py-2 rounded-pill bg-card border border-border active:bg-card-elevated"
              >
                <Text className="text-xs font-medium text-foreground">{t(key)}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={minimumVersion}
            onChangeText={(txt) => setMinimumVersion(txt.slice(0, MAX_MINIMUM_LENGTH))}
            placeholder={t('habits.minimumPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
          />
        </View>

        {suggestedTip ? (
          <View className="gap-2 p-4 rounded-card border border-primary/30 bg-primary/5">
            <View className="flex-row items-center gap-2">
              <Icon name="bulb-outline" size={18} colorClassName="accent-primary" />
              <Text className="text-sm font-semibold text-primary">
                {t('envTip.sectionTitle')}
              </Text>
              <View className="ml-auto px-2 py-0.5 rounded-pill bg-card">
                <Text className="text-[11px] font-medium text-foreground-secondary">
                  {t(`envTip.effort.${suggestedTip.effort}`)}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-foreground-secondary">
              {t('envTip.sectionHint')}
            </Text>
            <Text className="text-sm text-foreground mt-1">
              {t(`envTip.${suggestedTip.id}`)}
            </Text>
            {suggestedTipActive ? (
              <Text className="text-xs font-semibold text-primary mt-1">
                {t('envTip.trying')} ✓
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  void setEnvExperiment({
                    tipId: suggestedTip.id,
                    status: 'trying',
                  });
                }}
                accessibilityRole="button"
                className="self-start px-3 py-2 rounded-pill bg-primary active:bg-primary/80 mt-1"
              >
                <Text className="text-xs font-bold text-primary-foreground">
                  {t('envTip.tryIt')}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <Button
          label={submitting ? t('common.loading') : t('common.save')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !name.trim()}
          onPress={handleCreate}
        />
      </ScrollView>
    </Screen>
  );
}
