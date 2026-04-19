import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import type { FreshStartEvent } from '@shared/lib/freshStart';

interface FreshStartBannerProps {
  event: FreshStartEvent;
  /** Rebel tendency = soft copy, no push-to-action. */
  isRebel?: boolean;
}

export function FreshStartBanner({ event, isRebel = false }: FreshStartBannerProps) {
  const { t } = useTranslation();

  const titleKey = `freshStart.banner.${event}.title`;
  const bodyKey = `freshStart.banner.${event}.${isRebel ? 'bodyRebel' : 'body'}`;

  return (
    <Card elevated>
      <View className="flex-row items-center gap-3 mb-2">
        <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center">
          <Icon name="sparkles-outline" size={20} colorClassName="accent-primary" />
        </View>
        <Text className="flex-1 text-base font-bold text-foreground">{t(titleKey)}</Text>
      </View>
      <Text className="text-sm text-foreground-secondary mb-4">{t(bodyKey)}</Text>
      <Button
        label={t(isRebel ? 'freshStart.bannerCtaRebel' : 'freshStart.bannerCta')}
        variant={isRebel ? 'secondary' : 'primary'}
        size="md"
        fullWidth
        onPress={() => router.push({ pathname: '/fresh-start', params: { event } })}
      />
    </Card>
  );
}
