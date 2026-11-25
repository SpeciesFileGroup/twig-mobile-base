import { useTheme } from 'expo-router'
import { Platform } from 'react-native'

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
}

export const palette = {
  muted: '#8e8e93',
  success: '#2e9d6b',
  warning: '#c98a16',
  danger: '#d64545',
}

export const cameraColors = {
  background: '#000',
  foreground: '#fff',
  button: 'rgba(0,0,0,0.45)',
  chip: 'rgba(0,0,0,0.55)',
  chipBorder: 'rgba(255,255,255,0.6)',
  guide: 'rgba(255,255,255,0.85)',
  textShadow: 'rgba(0,0,0,0.8)',
  focusRing: '#ffd60a',
}

export function useAppTheme() {
  const { colors, dark } = useTheme()
  return { dark, colors: { ...colors, ...palette } }
}

export type Tone = 'success' | 'warning' | 'danger'
