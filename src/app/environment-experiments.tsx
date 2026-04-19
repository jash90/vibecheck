import { Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';
import { cn } from '@shared/lib/cn';
import { tipById } from '@shared/content/environmentTips';

type Status = 'trying' | 'works' | 'not_for_me';

function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export default function EnvironmentExperimentsScreen() {
  const { t, i18n } = useTranslation();
  const me = useQuery(api.users.me);
  const setStatus = useMutation(api.users.setEnvironmentExperiment);
  const remove = useMutation(api.users.removeEnvironmentExperiment);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const experiments = me?.environmentExperiments ?? [];

  const statusOptions: Status[] = ['trying', 'works', 'not_for_me'];

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('experiments.title')} onClose={closeScreen} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-8 gap-4"
      >
        {experiments.length === 0 ? (
          <Card>
            <Text className="text-sm text-foreground-secondary text-center py-4">
              {t('experiments.empty')}
            </Text>
          </Card>
        ) : (
          experiments.map((exp) => {
            const tip = tipById(exp.tipId);
            if (!tip) return null;
            return (
              <Card key={exp.tipId}>
                <View className="flex-row items-start gap-2 mb-3">
                  <Icon name="bulb-outline" size={18} colorClassName="accent-primary" />
                  <Text className="flex-1 text-sm text-foreground leading-relaxed">
                    {t(`envTip.${tip.id}`)}
                  </Text>
                </View>
                <Text className="text-xs text-foreground-secondary mb-3">
                  {t('experiments.startedAt', {
                    date: formatDate(exp.startedAt, i18n.language),
                  })}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {statusOptions.map((s) => {
                    const isSelected = exp.status === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => {
                          if (!isSelected) void setStatus({ tipId: exp.tipId, status: s });
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        className={cn(
                          'px-3 py-2 rounded-pill border',
                          isSelected
                            ? 'bg-primary/20 border-primary'
                            : 'bg-card border-border active:bg-card-elevated',
                        )}
                      >
                        <Text
                          className={cn(
                            'text-xs font-medium',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {t(`envTip.${s === 'not_for_me' ? 'notForMe' : s}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => void remove({ tipId: exp.tipId })}
                    accessibilityRole="button"
                    className="px-3 py-2 rounded-pill border border-border active:bg-card-elevated"
                  >
                    <Text className="text-xs font-medium text-foreground-secondary">
                      {t('envTip.remove')}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
