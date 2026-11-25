import type { ErrorBoundaryProps } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { palette, useAppTheme } from './theme'

export function ScreenError({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  message: { color: palette.muted, fontSize: 14, textAlign: 'center' },
  button: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
