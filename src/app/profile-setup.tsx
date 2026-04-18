import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(normalized)) {
      setError(t('profileSetup.invalidUsername'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({ username: normalized });
      router.replace('/home');
    } catch (e) {
      const code = (e as { data?: { code?: string } }).data?.code;
      if (code === 'USERNAME_TAKEN') {
        setError(t('profileSetup.usernameTaken'));
      } else {
        Alert.alert(t('common.error'), (e as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 mb-8 gap-2">
        <Text className="text-3xl font-bold text-foreground">{t('profileSetup.title')}</Text>
        <Text className="text-base text-foreground-secondary">{t('profileSetup.subtitle')}</Text>
      </View>

      <View className="gap-2 mb-8">
        <Text className="text-sm font-medium text-foreground">
          {t('profileSetup.usernameLabel')}
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t('profileSetup.usernamePlaceholder')}
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

      <View className="flex-1" />

      <Button
        label={submitting ? t('common.loading') : t('profileSetup.finish')}
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || !username}
        onPress={handleFinish}
      />
    </Screen>
  );
}
