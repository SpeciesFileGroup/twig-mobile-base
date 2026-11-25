import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

type Props = { message: string }

export function BusyOverlay({ message }: Props) {
  return (
    <View style={styles.overlay} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
