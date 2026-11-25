import { useSyncExternalStore } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { cameraColors } from '@/shared/components'

import type { ZoomValue } from '../hooks/usePinchZoom'
import { formatZoom, roundZoom } from '../utils/cameraZoom'

type Props = {
  value: ZoomValue
  pinching: boolean
  onReset: () => void
}

/** Zoom label: re-renders only when the rounded zoom it shows changes, not on every pinch frame */
export function ZoomControl({ value, pinching, onReset }: Props) {
  const zoom = useSyncExternalStore(value.subscribe, () => roundZoom(value.get()))

  if (!pinching && zoom <= 1) return null

  return (
    <Pressable
      onPress={onReset}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Zoom ${formatZoom(zoom)}`}
      accessibilityHint="Resets the zoom"
      style={({ pressed }) => [styles.chip, pinching && styles.active, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.text, pinching && styles.activeText]}>{formatZoom(zoom)}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cameraColors.chip,
    borderWidth: 1,
    borderColor: cameraColors.chipBorder,
  },
  active: { backgroundColor: cameraColors.foreground, borderColor: cameraColors.foreground },
  text: { color: cameraColors.foreground, fontSize: 13, fontWeight: '700' },
  activeText: { color: cameraColors.background },
})
