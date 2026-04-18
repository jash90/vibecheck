import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useTranslation } from 'react-i18next';

import { Screen } from '@shared/ui/Screen';
import { Button } from '@shared/ui/Button';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState<'google' | 'apple' | null>(null);

  async function handleSignIn(provider: 'google' | 'apple') {
    setIsSigningIn(provider);
    try {
      await signIn(provider);
    } catch (error) {
      console.warn('Sign-in failed', error);
      Alert.alert(t('common.error'), t('signIn.failed'));
    } finally {
      setIsSigningIn(null);
    }
  }

  return (
    <Screen className="justify-center">
      <View className="items-center gap-3 mb-12">
        <Text className="text-6xl">🔥</Text>
        <Text className="text-4xl font-bold text-foreground">{t('app.name')}</Text>
        <Text className="text-base text-foreground-secondary text-center px-6">
          {t('app.tagline')}
        </Text>
      </View>

      <View className="gap-3">
        <Button
          label={t('signIn.withGoogle')}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={isSigningIn !== null}
          onPress={() => handleSignIn('google')}
        />
        <Button
          label={t('signIn.withApple')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSigningIn !== null}
          onPress={() => handleSignIn('apple')}
        />
      </View>

      <Text className="text-xs text-foreground-secondary text-center mt-8 px-4">
        {t('signIn.termsNotice')}
      </Text>
    </Screen>
  );
}
