import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'

import { APP_CONFIG } from '@/config'
import { useSettings } from '@/features/settings'
import { Row, Section, palette, useAppTheme } from '@/shared/components'

import { endSession, useSession } from '../store'
import { formatRemaining } from '../utils/formatRemaining'

const FOOTER = `Open ${APP_CONFIG.taskName} in TaxonWorks and scan its QR code. The session has a limited time and is kept in memory only: closing the app ends it.`

export function SessionSection() {
  const { colors } = useAppTheme()
  const serverUrl = useSettings((s) => s.serverUrl)
  const session = useSession((s) => s.session)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!session) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [session])

  const remaining = session ? session.expiresAt - now : 0
  useEffect(() => {
    if (session && remaining <= 0) endSession()
  }, [session, remaining])

  const connect = () => router.push('/connect')

  if (!session || remaining <= 0) {
    return (
      <Section
        title="TaxonWorks session"
        footer={serverUrl ? FOOTER : 'Set the home server in Settings first.'}
      >
        <Row>
          <Text style={[styles.flex, { color: palette.muted }]}>Not connected</Text>
          <Button title="Scan QR code" disabled={!serverUrl} onPress={connect} />
        </Row>
      </Section>
    )
  }

  return (
    <Section title="TaxonWorks session" footer={FOOTER}>
      <Row>
        <View style={styles.flex}>
          <Text style={{ color: palette.success, fontSize: 16 }}>Connected</Text>
          <Text style={[styles.meta, { color: colors.text }]}>
            Project {session.projectId}
            {session.compositionId != null && ` · task ${session.compositionId}`}
          </Text>
        </View>
        <Text style={[styles.meta, { color: palette.muted }]}>Ends in {formatRemaining(remaining)}</Text>
      </Row>
      <Row>
        <View style={styles.flex}>
          <Button title="Scan a new QR code" onPress={connect} />
        </View>
        <Button title="Disconnect" color={palette.danger} onPress={endSession} />
      </Row>
    </Section>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  meta: { fontSize: 13, fontVariant: ['tabular-nums'] },
})
