import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@convex/_generated/api';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState<string | null>(null);
  const match = useQuery(api.friendships.findByUsername, lookup ? { username: lookup } : 'skip');
  const sendRequest = useMutation(api.friendships.sendRequest);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!match) return;
    setSending(true);
    try {
      await sendRequest({ toUserId: match._id as never });
      setSent(true);
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <View className="mt-4 mb-6 gap-2">
        <Text className="text-3xl font-bold text-foreground">{t('friends.add')}</Text>
        <Text className="text-base text-foreground-secondary">{t('friends.addByUsername')}</Text>
      </View>

      <View className="gap-3 mb-6">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.usernamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColorClassName="accent-muted"
          cursorColorClassName="accent-primary"
          selectionColorClassName="accent-primary"
          className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground focus:border-primary"
        />
        <Button
          label={t('friends.search')}
          variant="secondary"
          size="md"
          fullWidth
          disabled={!query.trim()}
          onPress={() => {
            setSent(false);
            setLookup(query.trim().toLowerCase());
          }}
        />
      </View>

      {lookup && match === undefined ? (
        <Text className="text-foreground-secondary">{t('common.loading')}</Text>
      ) : null}

      {lookup && match === null ? (
        <Card>
          <Text className="text-base text-foreground-secondary text-center py-3">
            {t('friends.notFound')}
          </Text>
        </Card>
      ) : null}

      {match ? (
        <Card>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-2xl">🙂</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{match.username}</Text>
              <Text className="text-sm text-foreground-secondary">
                {t('friends.level', { level: match.level })}
              </Text>
            </View>
          </View>
          <Button
            label={sent ? t('friends.sent') : t('friends.sendRequest')}
            variant={sent ? 'secondary' : 'primary'}
            size="md"
            fullWidth
            disabled={sending || sent}
            onPress={handleSend}
          />
          {sent ? (
            <Button
              label={t('common.done')}
              variant="ghost"
              size="sm"
              fullWidth
              onPress={() => router.back()}
              className="mt-2"
            />
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}
