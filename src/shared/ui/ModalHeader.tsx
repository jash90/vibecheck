import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';

interface ModalHeaderProps {
  title: string;
  /** Override the default close behaviour (router.back). */
  onClose?: () => void;
  /** Optional right-side slot for action buttons (icon size ~40x40). */
  right?: ReactNode;
  /** Leading icon — 'close' for modals, 'chevron-back' for pushed stacks. */
  icon?: IconName;
}

/**
 * Shared header for modal screens. Keeps the close button, centered title
 * and optional right action layout consistent across every modal in the app.
 *
 * Structure:
 *   [X]        [title]         [right | spacer]
 */
export function ModalHeader({ title, onClose, right, icon = 'close' }: ModalHeaderProps) {
  const { t } = useTranslation();

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/40 bg-background">
      <Pressable
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel={icon === 'chevron-back' ? t('common.back') : t('common.close')}
        hitSlop={12}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-card"
      >
        <Icon name={icon} size={24} colorClassName="accent-foreground" />
      </Pressable>
      <Text
        className="flex-1 text-center text-base font-semibold text-foreground"
        numberOfLines={1}
      >
        {title}
      </Text>
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
