import { Linking, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Screen } from '@shared/ui/Screen';

interface CrisisLine {
  title: string;
  hours?: string;
  number: string;
  priority?: boolean;
}

export default function CrisisResourcesScreen() {
  const { t } = useTranslation();

  const lines: CrisisLine[] = [
    {
      title: t('crisis.teenLine'),
      hours: t('crisis.teenLineHours'),
      number: t('crisis.teenLineNumber'),
      priority: true,
    },
    {
      title: t('crisis.adultLine'),
      number: t('crisis.adultLineNumber'),
    },
    {
      title: t('crisis.emergency'),
      number: t('crisis.emergencyNumber'),
      priority: true,
    },
  ];

  function call(number: string) {
    const stripped = number.replace(/\s+/g, '');
    void Linking.openURL(`tel:${stripped}`);
  }

  return (
    <Screen padded={false}>
      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        <View className="gap-2 mt-4 mb-2">
          <Text className="text-3xl font-bold text-foreground">{t('crisis.title')}</Text>
          <Text className="text-base text-foreground-secondary">{t('crisis.note')}</Text>
        </View>

        {lines.map((line) => (
          <Card key={line.title} elevated>
            <Text className="text-base font-semibold text-foreground">{line.title}</Text>
            {line.hours ? (
              <Text className="text-xs text-foreground-secondary mt-0.5">{line.hours}</Text>
            ) : null}
            <Text className="text-3xl font-bold text-primary mt-3 mb-3">{line.number}</Text>
            <Button
              label={t('crisis.callNow')}
              variant={line.priority ? 'primary' : 'secondary'}
              size="md"
              fullWidth
              onPress={() => call(line.number)}
            />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
