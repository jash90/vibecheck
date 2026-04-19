import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui/Button';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Flow = 'signIn' | 'signUp';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(t('signIn.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('signIn.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    try {
      await signIn('password', { email: trimmedEmail, password, flow });
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('InvalidAccountId') || msg.includes('InvalidSecret')) {
        setError(t('signIn.invalidCredentials'));
      } else if (msg.includes('already exists') || msg.includes('duplicate')) {
        setError(t('signIn.emailAlreadyUsed'));
      } else {
        Alert.alert(t('common.error'), t('signIn.failed'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="justify-center">
      <View className="items-center gap-3 mb-10">
        <View className="w-20 h-20 rounded-full bg-flame/20 border border-flame/40 items-center justify-center">
          <Icon name="flame" size={44} colorClassName="accent-flame" />
        </View>
        <Text className="text-4xl font-bold text-foreground">{t('app.name')}</Text>
        <Text className="text-base text-foreground-secondary text-center px-6">
          {t('app.tagline')}
        </Text>
      </View>

      <View className="flex-row bg-card border border-border rounded-xl p-1 mb-6">
        <TabButton
          label={t('signIn.tabSignIn')}
          active={flow === 'signIn'}
          onPress={() => {
            setFlow('signIn');
            setError(null);
          }}
        />
        <TabButton
          label={t('signIn.tabSignUp')}
          active={flow === 'signUp'}
          onPress={() => {
            setFlow('signUp');
            setError(null);
          }}
        />
      </View>

      <View className="gap-3 mb-4">
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('signIn.emailLabel')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('signIn.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className={cn(
              'bg-card border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary',
              error ? 'border-danger' : 'border-border',
            )}
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('signIn.passwordLabel')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('signIn.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={flow === 'signUp' ? 'new-password' : 'current-password'}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className={cn(
              'bg-card border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary',
              error ? 'border-danger' : 'border-border',
            )}
          />
        </View>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      </View>

      <Button
        label={
          submitting
            ? t('common.loading')
            : flow === 'signIn'
              ? t('signIn.submitSignIn')
              : t('signIn.submitSignUp')
        }
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || !email || !password}
        onPress={handleSubmit}
      />

      <Text className="text-xs text-foreground-secondary text-center mt-6 px-4">
        {t('signIn.termsNotice')}
      </Text>
    </Screen>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-1 px-4 py-2.5 rounded-lg items-center',
        active ? 'bg-primary' : 'bg-transparent active:bg-card-elevated',
      )}
    >
      <Text
        className={cn(
          'text-sm font-semibold',
          active ? 'text-primary-foreground' : 'text-foreground-secondary',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
