import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAction } from 'convex/react';
import { useTranslation } from 'react-i18next';

declare const __DEV__: boolean;

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';

interface AdultingTipCardProps {
  id: string;
  fallbackTitle?: string;
  fallbackBody?: string;
  source?: 'ai' | 'static';
}

export function AdultingTipCard({ id, fallbackTitle, fallbackBody, source }: AdultingTipCardProps) {
  const { t } = useTranslation();
  const isAi = source === 'ai';
  const title = isAi
    ? fallbackTitle ?? ''
    : t(`tips.${id}.title`, { defaultValue: fallbackTitle ?? '' });
  const body = isAi
    ? fallbackBody ?? ''
    : t(`tips.${id}.body`, { defaultValue: fallbackBody ?? '' });

  const generate = useAction(api.adultingTips.generateAiTipForMe);
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await generate();
      if (res.status === 'no_focus') {
        Alert.alert(t('insights.aiRefreshNoFocusTitle'), t('insights.aiRefreshNoFocusBody'));
      } else if (res.status === 'cooldown') {
        Alert.alert(
          t('insights.aiRefreshCooldownTitle'),
          __DEV__ ? t('insights.aiRefreshCooldownBodyDev') : t('insights.aiRefreshCooldownBody'),
        );
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-2">
        <Icon name="bulb" size={18} colorClassName="accent-warning" />
        <Text className="flex-1 text-sm font-bold text-foreground">
          {t('insights.kind.adulting_tip')}
        </Text>
        {isAi ? (
          <View className="px-2 py-0.5 rounded-pill bg-primary/15 border border-primary/30">
            <Text className="text-[10px] font-bold text-primary uppercase">
              {t('insights.aiLabel')}
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={handleRefresh}
          disabled={loading}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('insights.aiRefresh')}
          className="w-8 h-8 items-center justify-center rounded-full active:bg-card-elevated"
        >
          <Icon
            name={loading ? 'hourglass-outline' : 'refresh-outline'}
            size={18}
            colorClassName="accent-primary"
          />
        </Pressable>
      </View>
      <Text className="text-base font-semibold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-foreground-secondary leading-5">{body}</Text>
    </Card>
  );
}
