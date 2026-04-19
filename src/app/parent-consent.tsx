import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ParentConsentScreen() {
  const { t } = useTranslation();
  const setParentEmail = useMutation(api.users.setParentEmail);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t('parentConsent.invalidEmail'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await setParentEmail({ parentEmail: trimmed });
      // In dev deployments the backend auto-approves and skips the email loop
      // so we can move straight into onboarding instead of the waiting screen.
      if (result.autoApproved) {
        router.replace('/focus-picker');
      } else {
        router.replace('/awaiting-parent');
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 mb-6 gap-2">
        <Text className="text-3xl font-bold text-foreground">{t('parentConsent.title')}</Text>
        <Text className="text-base text-foreground-secondary">
          {t('parentConsent.subtitle')}
        </Text>
      </View>

      <View className="gap-2 mb-6">
        <Text className="text-sm font-medium text-foreground">
          {t('parentConsent.parentEmailLabel')}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('parentConsent.parentEmailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColorClassName="accent-muted"
          cursorColorClassName="accent-primary"
          selectionColorClassName="accent-primary"
          className={cn(
            'bg-card border rounded-xl px-4 py-3 text-base text-foreground',
            error ? 'border-danger' : 'border-border',
            'focus:border-primary',
          )}
        />
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      </View>

      <Button
        label={submitting ? t('common.loading') : t('parentConsent.send')}
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || !email}
        onPress={handleSubmit}
      />
    </Screen>
  );
}
