import { useTheme } from 'expo-router'

import { palette } from '@/shared/theme'

export function useAppTheme() {
  const { colors, dark } = useTheme()
  return { dark, colors: { ...colors, ...palette } }
}
