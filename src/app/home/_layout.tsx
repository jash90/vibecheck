import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useCSSVariable } from 'uniwind';

export default function HomeTabsLayout() {
  const { t } = useTranslation();
  const primary = useCSSVariable('--color-primary') as string | undefined;
  const muted = useCSSVariable('--color-muted') as string | undefined;
  const bg = useCSSVariable('--color-background') as string | undefined;
  const border = useCSSVariable('--color-border') as string | undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary ?? '#8b5cf6',
        tabBarInactiveTintColor: muted ?? '#94a3b8',
        tabBarStyle: {
          backgroundColor: bg ?? '#0b0f1a',
          borderTopColor: border ?? '#1f2937',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.dailyCardTitle'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('habits.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="✅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🙂" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ color, fontSize: 20 }}>{emoji}</Text>;
}
