import { Pressable, Text, View, type PressableProps } from 'react-native';

import { cn } from '@shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary/80',
  secondary: 'bg-card border border-border active:bg-card-elevated',
  ghost: 'bg-transparent active:bg-card/60',
  danger: 'bg-danger active:bg-danger/80',
};

const labelClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  ghost: 'text-foreground',
  danger: 'text-primary-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-4 py-3 rounded-xl',
  lg: 'px-5 py-4 rounded-card',
};

const labelSizes: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth,
  leading,
  trailing,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center gap-2',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-40',
        className,
      )}
    >
      {leading ? <View>{leading}</View> : null}
      <Text className={cn('font-semibold', labelSizes[size], labelClasses[variant])}>{label}</Text>
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}
