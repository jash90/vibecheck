import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function HomeTabsLayout() {
  const { t } = useTranslation();
  const primary = useCSSVariable('--color-primary') as string | undefined;
  const muted = useCSSVariable('--color-muted') as string | undefined;
  const bg = useCSSVariable('--color-background') as string | undefined;
  const border = useCSSVariable('--color-border') as string | undefined;

  const renderIcon = (name: IoniconName) => {
    const IconComponent = ({ color }: { color: string }) => (
      <Ionicons name={name} size={22} color={color} />
    );
    IconComponent.displayName = `TabIcon(${name})`;
    return IconComponent;
  };

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
          tabBarIcon: renderIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('habits.title'),
          tabBarIcon: renderIcon('checkmark-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('progress.tab'),
          tabBarIcon: renderIcon('trophy-outline'),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends.title'),
          tabBarIcon: renderIcon('people-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: renderIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
