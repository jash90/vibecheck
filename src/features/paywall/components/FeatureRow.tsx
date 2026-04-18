import { Text, View } from 'react-native';

import { cn } from '@shared/lib/cn';

interface FeatureRowProps {
  label: string;
  included: boolean;
  highlighted?: boolean;
}

export function FeatureRow({ label, included, highlighted }: FeatureRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border last:border-b-0">
      <Text
        className={cn(
          'text-xl w-7 text-center',
          included ? 'text-success' : 'text-muted',
        )}
      >
        {included ? '✓' : '–'}
      </Text>
      <Text
        className={cn(
          'flex-1 text-base',
          highlighted ? 'text-primary font-semibold' : 'text-foreground',
          !included && 'opacity-60',
        )}
      >
        {label}
      </Text>
    </View>
  );
}
