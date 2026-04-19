import { View, Text } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui/Button';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

export default function BlockedScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();

  return (
    <Screen className="justify-center">
      <View className="items-center gap-4 mb-12">
        <View className="w-20 h-20 rounded-full bg-success/20 border border-success/40 items-center justify-center">
          <Icon name="leaf-outline" size={44} colorClassName="accent-success" />
        </View>
        <Text className="text-3xl font-bold text-foreground text-center">
          {t('blocked.title')}
        </Text>
        <Text className="text-base text-foreground-secondary text-center">
          {t('blocked.message')}
        </Text>
      </View>
      <Button
        label={t('profile.signOut')}
        variant="secondary"
        size="lg"
        fullWidth
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
