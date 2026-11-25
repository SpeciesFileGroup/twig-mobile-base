import { Pressable, StyleSheet } from 'react-native'

import { useAppTheme } from '@/shared/hooks'

import { Icon, type IconName } from './Icon'

type Props = {
  icon: IconName
  label: string
  onPress: () => void
  disabled?: boolean
}

export function IconButton({ icon, label, onPress, disabled }: Props) {
  const { colors } = useAppTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, disabled ? styles.disabled : pressed && styles.pressed]}
    >
      <Icon name={icon} color={colors.text} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.5 },
})
