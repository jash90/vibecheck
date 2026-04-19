import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Icon, type IconName } from '@shared/ui/Icon';

export function MiniLeaderboard() {
  const { t } = useTranslation();
  const leaderboard = useQuery(api.leaderboards.friendLeaderboard);

  if (leaderboard === undefined) return null;

  const top = leaderboard.slice(0, 3);
  const onlyMe = top.length <= 1 && top.every((e) => e.isMe);

  if (onlyMe) {
    return (
      <Card>
        <View className="flex-row items-center gap-2 mb-2">
          <Icon name="people-outline" size={18} colorClassName="accent-primary" />
          <Text className="flex-1 text-base font-bold text-foreground">
            {t('home.topFriends')}
          </Text>
        </View>
        <Text className="text-sm text-foreground-secondary mb-3">
          {t('friends.empty')}
        </Text>
        <Button
          label={t('friends.add')}
          variant="secondary"
          size="sm"
          onPress={() => router.push('/add-friend')}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Text className="text-lg font-bold text-foreground mb-3">{t('home.topFriends')}</Text>
      <View className="gap-2">
        {top.map((entry, idx) => {
          const medalIcons: IconName[] = ['trophy', 'medal', 'medal-outline'];
          const medalColors = ['accent-warning', 'accent-muted', 'accent-flame'];
          return (
            <View
              key={entry.userId}
              className="flex-row items-center gap-3 py-2"
            >
              <Icon
                name={medalIcons[idx] ?? 'person'}
                size={20}
                colorClassName={medalColors[idx] ?? 'accent-muted'}
              />
              <Text className="flex-1 text-base font-semibold text-foreground">
                {entry.username ?? '—'}
                {entry.isMe ? ` ${t('friends.youSuffix')}` : ''}
              </Text>
              <Text className="text-sm font-bold text-primary">{entry.score}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
