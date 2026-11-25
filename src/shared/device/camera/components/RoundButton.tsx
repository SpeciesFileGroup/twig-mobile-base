import { Pressable, StyleSheet } from 'react-native'

import { cameraColors, Icon, type IconName } from '@/shared/components'

import { Rotatable } from './Rotatable'

type Props = {
  icon: IconName
  label: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
}

/** Round button over the camera preview; its icon turns with the phone (see Rotatable) */
export function RoundButton({ icon, label, onPress, disabled, active }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        roundButtonStyles.round,
        active && roundButtonStyles.active,
        disabled && roundButtonStyles.disabled,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Rotatable>
        <Icon name={icon} size={22} color={active ? cameraColors.background : cameraColors.foreground} />
      </Rotatable>
    </Pressable>
  )
}

/** Shared by other round controls over the camera, so they all look alike */
export const roundButtonStyles = StyleSheet.create({
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cameraColors.button,
  },
  active: { backgroundColor: cameraColors.foreground },
  disabled: { opacity: 0.4 },
})
