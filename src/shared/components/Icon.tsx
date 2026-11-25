import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import type { ColorValue } from 'react-native'

const ICONS = {
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  more: { ios: 'ellipsis.circle', android: 'more_vert', web: 'more_vert' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  sync: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  codes: { ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  next: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
} satisfies Record<string, Extract<SymbolViewProps['name'], object>>

export type IconName = keyof typeof ICONS

type Props = { name: IconName; size?: number; color: ColorValue }

export function Icon({ name, size = 24, color }: Props) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />
}
