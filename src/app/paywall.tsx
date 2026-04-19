import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

import { FeatureRow } from '@features/paywall/components/FeatureRow';

const FEATURES = [
  { labelKey: 'paywall.feat.unlimitedHabits', free: false, pro: true, highlight: true },
  { labelKey: 'paywall.feat.privateChallenges', free: false, pro: true, highlight: true },
  { labelKey: 'paywall.feat.fullInsights', free: false, pro: true, highlight: true },
  { labelKey: 'paywall.feat.fullCorrelations', free: false, pro: true },
  { labelKey: 'paywall.feat.coreTracking', free: true, pro: true },
  { labelKey: 'paywall.feat.friendLeaderboard', free: true, pro: true },
  { labelKey: 'paywall.feat.basicAchievements', free: true, pro: true },
  { labelKey: 'paywall.feat.streakFreeze', free: true, pro: true },
  { labelKey: 'paywall.feat.crisis', free: true, pro: true },
];

export default function PaywallScreen() {
  const { t } = useTranslation();
  const upgrade = useMutation(api.subscriptions.upgradeProStub);
  const [upgrading, setUpgrading] = useState(false);

  const hasRcIos = Boolean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
  const hasRcAndroid = Boolean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
  const purchaseConfigured = hasRcIos || hasRcAndroid;

  async function handleUpgrade() {
    if (!purchaseConfigured) {
      Alert.alert(t('paywall.comingSoonTitle'), t('paywall.comingSoonBody'));
      return;
    }
    setUpgrading(true);
    try {
      // In prod: call RevenueCat.purchasePackage() here; webhook updates Convex.
      // For the Phase 5 dev surface, we skip to the stub that marks the user Pro.
      await upgrade({});
      Alert.alert(t('paywall.thanksTitle'), t('paywall.thanksBody'));
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-5">
        <View className="items-center gap-3 mt-4">
          <View className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 items-center justify-center">
            <Icon name="sparkles" size={44} colorClassName="accent-primary" />
          </View>
          <Text className="text-3xl font-bold text-foreground text-center">
            {t('paywall.title')}
          </Text>
          <Text className="text-base text-foreground-secondary text-center">
            {t('paywall.subtitle')}
          </Text>
        </View>

        <Card elevated>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">{t('paywall.planPro')}</Text>
            <View className="items-end">
              <Text className="text-2xl font-bold text-primary">€1.69</Text>
              <Text className="text-xs text-foreground-secondary">{t('paywall.perMonth')}</Text>
            </View>
          </View>
          <View>
            {FEATURES.map((f) => (
              <FeatureRow
                key={f.labelKey}
                label={t(f.labelKey)}
                included={f.pro}
                highlighted={f.highlight}
              />
            ))}
          </View>
        </Card>

        <Button
          label={upgrading ? t('common.loading') : t('paywall.upgrade')}
          variant="primary"
          size="lg"
          fullWidth
          disabled={upgrading}
          onPress={handleUpgrade}
        />

        <Text className="text-xs text-foreground-secondary text-center px-2">
          {t('paywall.safetyPromise')}
        </Text>

        <Text className="text-xs text-foreground-secondary text-center">
          {t('paywall.termsNote')}
        </Text>
      </ScrollView>
    </Screen>
  );
}
