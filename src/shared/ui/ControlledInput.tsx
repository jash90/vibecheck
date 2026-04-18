import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { cn } from '@shared/lib/cn';

interface ControlledInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'defaultValue'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  error?: string;
  hint?: string;
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  hint,
  className,
  ...textInputProps
}: ControlledInputProps<T>) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextInput
            {...textInputProps}
            value={(field.value as string | undefined) ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            className={cn(
              'bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground',
              'focus:border-primary',
              error && 'border-danger',
              className,
            )}
          />
        )}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      {!error && hint ? (
        <Text className="text-sm text-foreground-secondary">{hint}</Text>
      ) : null}
    </View>
  );
}
