import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Card } from '@shared/ui/Card';

export function MiniLeaderboard() {
  const { t } = useTranslation();
  const leaderboard = useQuery(api.leaderboards.friendLeaderboard);

  if (leaderboard === undefined) {
    return (
      <Card>
        <Text className="text-base text-foreground-secondary">{t('common.loading')}</Text>
      </Card>
    );
  }

  const top = leaderboard.slice(0, 3);

  return (
    <Card>
      <Text className="text-lg font-bold text-foreground mb-3">{t('home.topFriends')}</Text>
      {top.length === 0 ? (
        <Text className="text-sm text-foreground-secondary py-2">{t('friends.empty')}</Text>
      ) : (
        <View className="gap-2">
          {top.map((entry, idx) => (
            <View
              key={entry.userId}
              className="flex-row items-center gap-3 py-2"
            >
              <Text className="text-xl">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </Text>
              <Text className="flex-1 text-base font-semibold text-foreground">
                {entry.username ?? '—'}
                {entry.isMe ? ' (Ty)' : ''}
              </Text>
              <Text className="text-sm font-bold text-primary">{entry.score}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
