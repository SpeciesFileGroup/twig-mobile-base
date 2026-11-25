import { useState } from 'react'
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native'

import { TaxonWorksClient } from '@/shared/api'
import { Row, Section } from '@/shared/components'
import { useAppTheme } from '@/shared/hooks'
import { fonts, palette } from '@/shared/theme'
import { messageOf } from '@/shared/utils/errors'

import { updateSettings, useSettings } from '../store'
import { normalizeServerUrl } from '../utils/serverUrl'

type ConnectionCheck =
  { state: 'idle' } | { state: 'checking' } | { state: 'ok' } | { state: 'error'; message: string }

/** Home server: the TaxonWorks instance the app works with. Only the URL is stored. */
export function ServerSection() {
  const { colors } = useAppTheme()
  const serverUrl = useSettings((s) => s.serverUrl)
  const [draft, setDraft] = useState(serverUrl ?? '')
  const [check, setCheck] = useState<ConnectionCheck>({ state: 'idle' })

  const saveServerUrl = (): string | null => {
    if (!draft.trim()) {
      updateSettings({ serverUrl: null })
      setCheck({ state: 'idle' })
      return null
    }
    const normalized = normalizeServerUrl(draft)
    if (!normalized) {
      setCheck({ state: 'error', message: 'Not a valid http(s) address' })
      return null
    }
    setDraft(normalized)
    if (normalized !== serverUrl) updateSettings({ serverUrl: normalized })
    return normalized
  }

  const testConnection = async () => {
    const url = saveServerUrl()
    if (!url) return
    setCheck({ state: 'checking' })
    try {
      const ok = await new TaxonWorksClient({ serverUrl: url }).ping()
      setCheck(ok ? { state: 'ok' } : { state: 'error', message: 'Not a TaxonWorks server' })
    } catch (e) {
      setCheck({ state: 'error', message: messageOf(e, 'Unreachable') })
    }
  }

  return (
    <Section
      title="Home server"
      footer="TaxonWorks instance the app works with. Access tokens are never stored on the device."
    >
      <Row>
        <TextInput
          value={draft}
          onChangeText={(text) => {
            setDraft(text)
            setCheck({ state: 'idle' })
          }}
          onEndEditing={saveServerUrl}
          placeholder="https://sfg.taxonworks.org"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Server address"
        />
      </Row>
      <Row>
        <View style={styles.status}>
          {check.state === 'checking' && <ActivityIndicator />}
          {check.state === 'ok' && <Text style={{ color: palette.success }}>Connected</Text>}
          {check.state === 'error' && <Text style={{ color: palette.danger }}>{check.message}</Text>}
        </View>
        <Button
          title="Test connection"
          disabled={!draft.trim() || check.state === 'checking'}
          onPress={testConnection}
        />
      </Row>
    </Section>
  )
}

const styles = StyleSheet.create({
  input: { flex: 1, fontSize: 16, fontFamily: fonts.mono, paddingVertical: 4 },
  status: { flex: 1 },
})
