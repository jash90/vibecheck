import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

export default function AgeGateScreen() {
  const { t } = useTranslation();
  const setBirthYear = useMutation(api.users.setBirthYear);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    if (!selectedYear) return;
    setSubmitting(true);
    try {
      const result = await setBirthYear({ birthYear: selectedYear });
      if (result.requiresParentConsent) {
        router.replace('/parent-consent');
      } else {
        router.replace('/focus-picker');
      }
    } catch (err) {
      const code = (err as { data?: { code?: string } }).data?.code;
      if (code === 'UNDERAGE_BLOCKED') {
        router.replace('/blocked');
      } else {
        Alert.alert(t('common.error'), t('ageGate.invalidYear'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 mb-6 gap-2">
        <Text className="text-3xl font-bold text-foreground">{t('ageGate.title')}</Text>
        <Text className="text-base text-foreground-secondary">{t('ageGate.subtitle')}</Text>
      </View>

      <Text className="text-sm font-medium text-foreground mb-3">{t('ageGate.birthYear')}</Text>

      <ScrollView className="flex-1" contentContainerClassName="gap-2 pb-8">
        {YEARS.map((year) => (
          <Button
            key={year}
            label={String(year)}
            variant={selectedYear === year ? 'primary' : 'secondary'}
            size="md"
            fullWidth
            onPress={() => setSelectedYear(year)}
          />
        ))}
      </ScrollView>

      <View className="pt-4 border-t border-border">
        <Button
          label={submitting ? t('common.loading') : t('ageGate.continue')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedYear || submitting}
          onPress={handleContinue}
          trailing={submitting ? <ActivityIndicator colorClassName="accent-primary-foreground" /> : null}
        />
      </View>

    </Screen>
  );
}
