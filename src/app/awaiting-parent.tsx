import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Screen } from '@shared/ui/Screen';

export default function AwaitingParentScreen() {
  const { t } = useTranslation();
  const me = useQuery(api.users.me);

  return (
    <Screen className="justify-center">
      <View className="items-center gap-4 mb-12">
        <Text className="text-6xl">✉️</Text>
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
