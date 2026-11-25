import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

import { useAppTheme } from '@/shared/hooks'
import { palette } from '@/shared/theme'

import { Icon, type IconName } from './Icon'

export type SheetAction = {
  label: string
  icon?: IconName
  destructive?: boolean
  onPress: () => void
}

type Props = {
  visible: boolean
  onClose: () => void
  title?: string
  header?: ReactNode
  actions: SheetAction[]
  dragFromHandleOnly?: boolean
}

const OFFSCREEN = 600
const CLOSE_DRAG = 80
const CLOSE_VELOCITY = 800
const DURATION = 250
const BACKDROP_FADE_DISTANCE = 300

export function BottomSheet({ visible, onClose, title, header, actions, dragFromHandleOnly = false }: Props) {
  const { colors } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [shown, setShown] = useState(visible)

  if (visible && !shown) setShown(true)

  const pending = useRef<(() => void) | null>(null)
  const offset = useSharedValue(OFFSCREEN)

  useEffect(() => {
    if (visible) offset.set(withTiming(0, { duration: DURATION, easing: Easing.out(Easing.cubic) }))
  }, [visible, offset])

  const slideOut = useCallback(
    (onDone: () => void) => {
      'worklet'
      offset.set(
        withTiming(OFFSCREEN, { duration: DURATION }, (done) => {
          if (done) scheduleOnRN(onDone)
        }),
      )
    },
    [offset],
  )

  useEffect(() => {
    if (visible || !shown) return
    slideOut(() => setShown(false))
  }, [visible, shown, slideOut])

  const runPending = () => {
    const action = pending.current
    pending.current = null
    action?.()
  }

  const finishClose = () => {
    setShown(false)
    onClose()

    if (Platform.OS !== 'ios') runPending()
  }

  const close = (then?: () => void) => {
    pending.current = then ?? null
    slideOut(finishClose)
  }

  const drag = usePanGesture({
    onUpdate: (e) => {
      'worklet'
      offset.set(Math.max(0, e.translationY))
    },
    onDeactivate: (e) => {
      'worklet'
      if (e.translationY > CLOSE_DRAG || e.velocityY > CLOSE_VELOCITY) {
        slideOut(finishClose)
      } else {
        offset.set(withTiming(0, { duration: DURATION }))
      }
    },
  })

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }))
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, offset.get() / BACKDROP_FADE_DISTANCE),
  }))

  const handle = (
    <View style={styles.handleArea}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
    </View>
  )

  const sheet = (
    <Animated.View
      style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }, sheetStyle]}
      accessibilityViewIsModal
    >
      {dragFromHandleOnly ? <GestureDetector gesture={drag}>{handle}</GestureDetector> : handle}
      {title && <Text style={styles.title}>{title}</Text>}
      {header}
      {actions.map((action) => {
        const color = action.destructive ? palette.danger : colors.text
        return (
          <Pressable
            key={action.label}
            onPress={() => close(action.onPress)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}
          >
            {action.icon && <Icon name={action.icon} size={22} color={color} />}
            <Text style={[styles.label, { color }]}>{action.label}</Text>
          </Pressable>
        )
      })}
    </Animated.View>
  )

  return (
    <Modal
      visible={shown}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => close()}
      onDismiss={runPending}
    >
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={styles.fill} onPress={() => close()} accessibilityLabel="Close menu" />
        </Animated.View>

        {dragFromHandleOnly ? sheet : <GestureDetector gesture={drag}>{sheet}</GestureDetector>}
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  handleArea: { alignItems: 'center', marginTop: -8, paddingTop: 8, paddingBottom: 8 },
  handle: { width: 40, height: 5, borderRadius: 3 },
  title: { color: palette.muted, fontSize: 13, paddingHorizontal: 16, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  label: { fontSize: 17 },
})
