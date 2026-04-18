import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@shared/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, className, onPress, elevated }: CardProps) {
  const baseClasses = cn(
    'rounded-card border border-border p-4',
    elevated ? 'bg-card-elevated' : 'bg-card',
    className,
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={cn(baseClasses, 'active:opacity-80')}>
        {children}
      </Pressable>
    );
  }

  return <View className={baseClasses}>{children}</View>;
}
