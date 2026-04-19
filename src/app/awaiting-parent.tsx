import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

export default function AwaitingParentScreen() {
  const { t } = useTranslation();
  const me = useQuery(api.users.me);
  const devAutoApprove = useMutation(api.users.devAutoApprove);
  const triedAutoApprove = useRef(false);

  useEffect(() => {
    if (triedAutoApprove.current) return;
    triedAutoApprove.current = true;

    // In dev deployments this promotes parentApproved → true so we can land on
    // the next onboarding step without a real parent email round-trip. In prod
    // the mutation is a no-op and the user waits for the email as designed.
    devAutoApprove({})
      .then((result) => {
        if (result.approved) {
          router.replace('/focus-picker');
        }
      })
      .catch(() => {
        // Ignore — worst case the user uses the "Change parent email" button.
      });
  }, [devAutoApprove]);

  return (
    <Screen className="justify-center">
      <View className="items-center gap-4 mb-12">
        <View className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 items-center justify-center">
          <Icon name="mail-outline" size={40} colorClassName="accent-primary" />
        </View>
        <Text className="text-3xl font-bold text-foreground text-center">
          {t('awaitingParent.title')}
        </Text>
        <Text className="text-base text-foreground-secondary text-center">
          {t('awaitingParent.subtitle', { email: me?.parentEmail ?? '...' })}
        </Text>
      </View>
      <View className="gap-3">
        <Button
          label={t('awaitingParent.changeEmail')}
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.replace('/parent-consent')}
        />
      </View>
    </Screen>
  );
}
