import { useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { create } from 'zustand'

type ToastAction = { label: string; onPress: () => void }
type ToastMessage = { id: number; text: string; action?: ToastAction }

type ToastState = {
  toast: ToastMessage | null
  bottom: number | null
}

const useToastStore = create<ToastState>(() => ({ toast: null, bottom: null }))
let nextId = 1

const DURATION_MS = 3000
const WITH_ACTION_MS = 5000

export function showToast(text: string, action?: ToastAction) {
  useToastStore.setState({ toast: { id: nextId++, text, action } })
}

export const hideToast = () => useToastStore.setState({ toast: null })

export const setToastBottom = (bottom: number | null) => useToastStore.setState({ bottom })

export function ToastHost() {
  const insets = useSafeAreaInsets()
  const { toast, bottom } = useToastStore()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(
      () => useToastStore.setState((s) => (s.toast?.id === toast.id ? { toast: null } : s)),
      toast.action ? WITH_ACTION_MS : DURATION_MS,
    )
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(150)}
      style={[styles.toast, { bottom: bottom ?? insets.bottom + 16 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text} numberOfLines={2}>
        {toast.text}
      </Text>
      {toast.action && (
        <Pressable
          onPress={() => {
            hideToast()
            toast.action?.onPress()
          }}
          hitSlop={10}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <Text style={[styles.action, { opacity: pressed ? 0.6 : 1 }]}>{toast.action?.label}</Text>
          )}
        </Pressable>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(28,28,30,0.95)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
  },
  text: { flex: 1, color: '#fff', fontSize: 14 },
  action: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
