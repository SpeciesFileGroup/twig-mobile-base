import Constants from 'expo-constants'
import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'

import { APP_CONFIG } from '@/config'
import { palette, useAppTheme } from '@/shared/components'

import { ServerSection } from '../components/ServerSection'

type Props = { session?: ReactNode; children?: ReactNode }

/**
 * Preferences: the home server, then the sections other features add: `session` right below the
 * server, `children` after it.
 */
export function SettingsScreen({ session, children }: Props) {
  const { colors } = useAppTheme()

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ServerSection />
      {session}
      {children}

      <Text style={styles.version}>
        {APP_CONFIG.displayName} {Constants.expoConfig?.version}
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  version: { color: palette.muted, fontSize: 12, textAlign: 'center', marginTop: 32 },
})
