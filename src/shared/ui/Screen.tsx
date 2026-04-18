import { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';

import { cn } from '@shared/lib/cn';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
  className?: string;
  safe?: boolean;
}

export function Screen({
  children,
  padded = true,
  safe = true,
  className,
  ...rest
}: ScreenProps) {
  return (
    <View
      {...rest}
      className={cn(
        'flex-1 bg-background',
        safe && 'pt-safe pb-safe',
        padded && 'px-6',
        className,
      )}
    >
      {children}
    </View>
  );
}
