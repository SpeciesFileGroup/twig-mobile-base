import { Pressable, StyleSheet, Text, View } from 'react-native'

import { cameraColors } from '@/shared/components'

type Props = {
  text: string
  action?: string
  onAction?: () => void
}

export function CameraMessage({ text, action, onAction }: Props) {
  return (
    <View style={styles.message}>
      <Text style={styles.text}>{text}</Text>
      {action && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.buttonText}>{action}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },

  text: {
    color: cameraColors.foreground,
    fontSize: 16,
    textAlign: 'center',
  },

  button: {
    backgroundColor: cameraColors.foreground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },

  buttonText: {
    color: cameraColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
})
