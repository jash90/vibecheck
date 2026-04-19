import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';

/**
 * Themable icon — wraps Ionicons so `colorClassName="accent-primary"` and
 * `className` both work. Keeps the app icon-only (no emoji in the chrome).
 */
export const Icon = withUniwind(Ionicons);

export type IconName = keyof typeof Ionicons.glyphMap;
