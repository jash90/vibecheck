import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon } from '@shared/ui/Icon';
import { Screen } from '@shared/ui/Screen';

export default function FriendsTab() {
  const { t } = useTranslation();
  const me = useQuery(api.users.me);
  const leaderboard = useQuery(api.leaderboards.friendLeaderboard);
  const pending = useQuery(api.friendships.listPendingRequests);
  const accept = useMutation(api.friendships.acceptRequest);
  const partnerRequests = useQuery(api.partnerships.incomingRequests);
  const requestPartner = useMutation(api.partnerships.requestPartnership);
  const respondToPartner = useMutation(api.partnerships.respondToRequest);

  async function handleAccept(requestId: string) {
    try {
      await accept({ requestId: requestId as never });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  async function handlePartnerRequest(userId: string) {
    try {
      await requestPartner({ toUserId: userId as never });
      Alert.alert(t('partner.requestSentTitle'), t('partner.requestSentBody'));
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  async function handlePartnerResponse(requestId: string, accepted: boolean) {
    try {
      await respondToPartner({ requestId: requestId as never, accept: accepted });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  return (
    <Screen padded={false}>
      <View className="px-6 pt-6 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-foreground">{t('friends.title')}</Text>
        <Button
          label={t('friends.add')}
          size="sm"
          variant="primary"
          onPress={() => router.push('/add-friend')}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-8 gap-4">
        {me?.accountabilityPartnerId ? (
          <Card onPress={() => router.push('/partnership')}>
            <View className="flex-row items-center gap-3">
              <Icon name="people" size={20} colorClassName="accent-primary" />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">
                  {t('partner.activeLabel')}
                </Text>
                <Text className="text-xs text-foreground-secondary mt-0.5">
                  {t('partner.openDetails')}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} colorClassName="accent-foreground-secondary" />
            </View>
          </Card>
        ) : null}

        {partnerRequests && partnerRequests.length > 0 ? (
          <Card>
            <Text className="text-base font-bold text-foreground mb-3">
              {t('partner.incomingLabel')}
            </Text>
            <View className="gap-2">
              {partnerRequests.map((r) => (
                <View
                  key={r.requestId}
                  className="flex-row items-center gap-2 py-2"
                >
                  <Text className="flex-1 text-base text-foreground">
                    {r.from?.username ?? '—'}
                  </Text>
                  <Button
                    label={t('partner.decline')}
                    variant="ghost"
                    size="sm"
                    onPress={() => handlePartnerResponse(r.requestId, false)}
                  />
                  <Button
                    label={t('partner.accept')}
                    variant="primary"
                    size="sm"
                    onPress={() => handlePartnerResponse(r.requestId, true)}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {pending && pending.length > 0 ? (
          <Card>
            <Text className="text-base font-bold text-foreground mb-3">
              {t('friends.pending')}
            </Text>
            <View className="gap-2">
              {pending.map((p) => (
                <View
                  key={p.requestId}
                  className="flex-row items-center gap-3 py-2"
                >
                  <Text className="flex-1 text-base text-foreground">
                    {p.from?.username ?? '—'}
                  </Text>
                  <Button
                    label={t('friends.accept')}
                    variant="primary"
                    size="sm"
                    onPress={() => handleAccept(p.requestId)}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card>
          <Text className="text-base font-bold text-foreground mb-3">{t('home.topFriends')}</Text>
          {leaderboard === undefined ? (
            <Text className="text-foreground-secondary">{t('common.loading')}</Text>
          ) : leaderboard.length === 0 ? (
            <Text className="text-sm text-foreground-secondary py-3">{t('friends.empty')}</Text>
          ) : (
            <View className="gap-1">
              {leaderboard.map((entry, idx) => (
                <View
                  key={entry.userId}
                  className="flex-row items-center gap-3 py-2.5 border-b border-border last:border-b-0"
                >
                  <Text className="w-8 text-base font-bold text-foreground-secondary">
                    #{idx + 1}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {entry.username ?? '—'}
                      {entry.isMe ? ' (Ty)' : ''}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs text-foreground-secondary">
                        {t('friends.level', { level: entry.level })} ·
                      </Text>
                      <Icon name="flame" size={10} colorClassName="accent-flame" />
                      <Text className="text-xs text-foreground-secondary">
                        {entry.currentStreak}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base font-bold text-primary">{entry.score}</Text>
                  {!entry.isMe && !me?.accountabilityPartnerId ? (
                    <Button
                      label={t('partner.inviteCta')}
                      variant="ghost"
                      size="sm"
                      onPress={() => handlePartnerRequest(entry.userId)}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
