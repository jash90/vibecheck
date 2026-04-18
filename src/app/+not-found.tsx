import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View className="flex-1 items-center justify-center bg-background px-6 gap-4">
        <Text className="text-2xl font-bold text-foreground">404</Text>
        <Link href="/" className="text-primary">
          <Text>{t('common.back')}</Text>
        </Link>
      </View>
    </>
  );
}
