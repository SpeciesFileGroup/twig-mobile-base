import { Platform } from 'react-native'

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
}
