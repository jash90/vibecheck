import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';

const MAX_TEXT = 280;
const MAX_COMMITMENT = 140;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ReflectionScreen() {
  const { t } = useTranslation();
  const today = todayISO();
  const log = useMutation(api.reflections.log);
  const todaysReflection = useQuery(
    api.reflections.listRecent,
    { limit: 1 },
  );
  const existing = (todaysReflection ?? []).find((r) => r.date === today) ?? null;

  const [whatWorked, setWhatWorked] = useState(existing?.whatWorked ?? '');
  const [whatFriction, setWhatFriction] = useState(existing?.whatFriction ?? '');
  const [commitment, setCommitment] = useState(existing?.tomorrowCommitment ?? '');
  const [submitting, setSubmitting] = useState(false);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      await log({
        date: today,
        whatWorked: whatWorked.trim() || undefined,
        whatFriction: whatFriction.trim() || undefined,
        tomorrowCommitment: commitment.trim() || undefined,
      });
      closeScreen();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('reflection.title')} onClose={closeScreen} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-foreground-secondary">
          {t('reflection.subtitle')}
        </Text>

        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">
            {t('reflection.whatWorked')}
          </Text>
          <TextInput
            value={whatWorked}
            onChangeText={(txt) => setWhatWorked(txt.slice(0, MAX_TEXT))}
            placeholder={t('reflection.whatWorkedPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[72px]"
          />
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">
            {t('reflection.whatFriction')}
          </Text>
          <TextInput
            value={whatFriction}
            onChangeText={(txt) => setWhatFriction(txt.slice(0, MAX_TEXT))}
            placeholder={t('reflection.whatFrictionPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[72px]"
          />
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">
            {t('reflection.commitment')}
          </Text>
          <Text className="text-xs text-foreground-secondary">
            {t('reflection.commitmentHint')}
          </Text>
          <TextInput
            value={commitment}
            onChangeText={(txt) => setCommitment(txt.slice(0, MAX_COMMITMENT))}
            placeholder={t('reflection.commitmentPlaceholder')}
            multiline
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary min-h-[72px]"
          />
        </View>
      </ScrollView>

      <View className="px-6 pt-3 pb-6 border-t border-border/40 bg-background">
        <Button
          label={submitting ? t('common.loading') : t('reflection.saveCta')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={submitting}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}
