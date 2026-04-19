import { useMemo } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { ModalHeader } from '@shared/ui/ModalHeader';
import { Screen } from '@shared/ui/Screen';

function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PartnershipScreen() {
  const { t, i18n } = useTranslation();
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const view = useQuery(api.partnerships.partnerView, {
    timezoneOffsetMinutes: tzOffset,
  });
  const endPartnership = useMutation(api.partnerships.endPartnership);

  function closeScreen() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function handleEnd() {
    Alert.alert(
      t('partner.endTitle'),
      t('partner.endBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('partner.endConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await endPartnership({});
              closeScreen();
            } catch (e) {
              Alert.alert(t('common.error'), (e as Error).message);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen padded={false} safe>
      <ModalHeader title={t('partner.title')} onClose={closeScreen} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6 gap-4"
      >
        {view === undefined ? (
          <Text className="text-foreground-secondary">{t('common.loading')}</Text>
        ) : view === null ? (
          <Card>
            <Text className="text-sm text-foreground-secondary py-4 text-center">
              {t('partner.noneBody')}
            </Text>
            <Button
              label={t('partner.findFromFriends')}
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.replace('/home/friends')}
            />
          </Card>
        ) : (
          <>
            <Card>
              <View className="items-center gap-2 py-4">
                <View className="w-16 h-16 rounded-full bg-primary/15 items-center justify-center">
                  <Icon name="people" size={32} colorClassName="accent-primary" />
                </View>
                <Text className="text-xl font-bold text-foreground">
                  {view.username ?? '—'}
                </Text>
                {view.partnershipStartedAt ? (
                  <Text className="text-xs text-foreground-secondary">
                    {t('partner.since', {
                      date: formatDate(view.partnershipStartedAt, i18n.language),
                    })}
                  </Text>
                ) : null}
              </View>
            </Card>

            <Card>
              <Text className="text-base font-bold text-foreground mb-2">
                {t('partner.todayTitle')}
              </Text>
              <Text className="text-xs text-foreground-secondary mb-3">
                {t('partner.privacyNote')}
              </Text>
              {view.habits.length === 0 ? (
                <Text className="text-sm text-foreground-secondary">
                  {t('partner.noHabits')}
                </Text>
              ) : (
                <View className="gap-1.5">
                  {view.habits.map((h) => (
                    <View
                      key={h.habitId}
                      className="flex-row items-center gap-2 py-2 border-b border-border last:border-b-0"
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${h.done ? 'bg-success border-success' : 'border-muted'}`}
                      >
                        {h.done ? (
                          <Text className="text-white text-[10px] font-bold">✓</Text>
                        ) : null}
                      </View>
                      <Text className="flex-1 text-sm text-foreground">{h.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Button
              label={t('partner.endCta')}
              variant="ghost"
              size="md"
              fullWidth
              onPress={handleEnd}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
