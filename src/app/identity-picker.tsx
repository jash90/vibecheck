import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import { type FocusCategory } from '@shared/constants/focus';
import { IDENTITY_PRESETS } from '@shared/constants/identityPresets';

const MAX_LENGTH = 120;

type CategorySelection =
  | { kind: 'preset'; presetId: string; text: string }
  | { kind: 'custom'; text: string };

type Selections = Partial<Record<FocusCategory, CategorySelection>>;

export default function IdentityPickerScreen() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = mode === 'edit';

  const me = useQuery(api.users.me);
  const setIdentityStatements = useMutation(api.users.setIdentityStatements);

  const [selections, setSelections] = useState<Selections>({});
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const focus = useMemo(
    () => (me?.focusCategories ?? []) as FocusCategory[],
    [me?.focusCategories],
  );

  useEffect(() => {
    if (hydrated || !me) return;
    const next: Selections = {};
    const stored = me.identityStatements ?? {};
    for (const cat of focus) {
      const current = stored[cat];
      if (!current) continue;
      const preset = IDENTITY_PRESETS[cat].find(
        (p) => t(p.i18nKey) === current,
      );
      next[cat] = preset
        ? { kind: 'preset', presetId: preset.id, text: current }
        : { kind: 'custom', text: current };
    }
    setSelections(next);
    setHydrated(true);
  }, [me, focus, hydrated, t]);

  function pickPreset(cat: FocusCategory, presetId: string, text: string) {
    setSelections((prev) => ({
      ...prev,
      [cat]: { kind: 'preset', presetId, text },
    }));
  }

  function pickCustom(cat: FocusCategory) {
    setSelections((prev) => ({
      ...prev,
      [cat]: { kind: 'custom', text: prev[cat]?.text ?? '' },
    }));
  }

  function setCustomText(cat: FocusCategory, text: string) {
    setSelections((prev) => ({
      ...prev,
      [cat]: { kind: 'custom', text: text.slice(0, MAX_LENGTH) },
    }));
  }

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const complete = focus.every((cat) => {
    const sel = selections[cat];
    if (!sel) return false;
    return sel.text.trim().length > 0;
  });

  async function handleSubmit() {
    if (!complete) return;
    setSubmitting(true);
    try {
      const statements: Record<string, string> = {};
      for (const cat of focus) {
        const sel = selections[cat]!;
        statements[cat] = sel.text.trim();
      }
      await setIdentityStatements({ statements });
      if (isEdit) {
        closeScreen();
      } else {
        router.replace('/tendency-quiz');
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (focus.length === 0) {
    return (
      <Screen>
        <Text className="text-foreground">{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false} safe>
      {isEdit ? <ModalHeader title={t('identity.editTitle')} onClose={closeScreen} /> : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName={cn('gap-6 pb-6', isEdit ? 'px-6 pt-4' : 'px-6 pt-8')}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">
            {isEdit ? t('identity.editTitle') : t('identity.title')}
          </Text>
          <Text className="text-base text-foreground-secondary">
            {t('identity.subtitle')}
          </Text>
        </View>

        {focus.map((cat) => {
          const current = selections[cat];
          const presets = IDENTITY_PRESETS[cat];
          return (
            <View key={cat} className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                {t(`focusPicker.${cat}`)}
              </Text>
              <View className="gap-2">
                {presets.map((preset) => {
                  const label = t(preset.i18nKey);
                  const isSelected =
                    current?.kind === 'preset' && current.presetId === preset.id;
                  return (
                    <Pressable
                      key={preset.id}
                      onPress={() => pickPreset(cat, preset.id, label)}
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
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => pickCustom(cat)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: current?.kind === 'custom' }}
                  className={cn(
                    'px-4 py-3 rounded-card border-2 border-dashed',
                    current?.kind === 'custom'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card/50 border-border active:bg-card-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      current?.kind === 'custom'
                        ? 'text-primary font-semibold'
                        : 'text-foreground-secondary',
                    )}
                  >
                    {t('identity.custom')}
                  </Text>
                </Pressable>

                {current?.kind === 'custom' ? (
                  <TextInput
                    value={current.text}
                    onChangeText={(txt) => setCustomText(cat, txt)}
                    placeholder={t('identity.customPlaceholder')}
                    placeholderTextColor="#7c7c8a"
                    maxLength={MAX_LENGTH}
                    multiline
                    className="px-4 py-3 rounded-card bg-card border border-primary/50 text-foreground text-sm"
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        <Button
          label={
            submitting
              ? t('common.loading')
              : isEdit
                ? t('common.save')
                : t('common.continue')
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting || !complete}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}
