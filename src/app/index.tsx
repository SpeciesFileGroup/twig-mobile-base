import { router, Stack } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'

import { IconButton } from '@/shared/components'
import { useAppTheme } from '@/shared/hooks'
import { fonts, palette } from '@/shared/theme'

/** Home screen of the template: replace its content with the app's own features */
export default function HomeRoute() {
  const { colors } = useAppTheme()

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
          ),
        }}
      />
      <Text style={[styles.hint, { color: palette.muted }]}>Your app starts here.</Text>
      <Text style={[styles.path, { color: palette.muted }]}>
        Edit <Text style={styles.mono}>src/app/index.tsx</Text> to replace this screen.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  hint: { fontSize: 15, textAlign: 'center', marginTop: 48 },
  path: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  mono: { fontFamily: fonts.mono },
})

export { ScreenError as ErrorBoundary } from '@/shared/components'
