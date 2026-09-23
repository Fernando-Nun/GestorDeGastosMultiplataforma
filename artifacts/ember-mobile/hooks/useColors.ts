import colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Uses the app preference from ThemeContext so the palette stays in sync
 * with the theme switch in Settings instead of following the device alone.
 */
export function useColors() {
  const { isDark } = useTheme();
  const palette =
    isDark && 'dark' in colors
      ? (colors as unknown as { dark: typeof colors.light }).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
