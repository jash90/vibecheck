import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface StreakFlameProps {
  streak: number;
}

export function StreakFlame({ streak }: StreakFlameProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-2 px-3 py-2 rounded-pill bg-flame/20 border border-flame/40">
      <Text className="text-xl">🔥</Text>
      <Text className="text-base font-bold text-flame">
        {t('home.streak', { count: streak })}
      </Text>
    </View>
  );
}
