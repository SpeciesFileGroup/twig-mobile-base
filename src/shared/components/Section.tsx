import type { ReactNode } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'

import { palette, useAppTheme } from './theme'

type SectionProps = { title?: string; footer?: string; children: ReactNode }

export function Section({ title, footer, children }: SectionProps) {
  const { colors } = useAppTheme()
  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.group, { backgroundColor: colors.card }]}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  )
}

type SwitchRowProps = { label: string; hint?: string; value: boolean; onChange: (value: boolean) => void }

export function SwitchRow({ label, hint, value, onChange }: SwitchRowProps) {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.flex}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  )
}

type RowProps = { children: ReactNode }

export function Row({ children }: RowProps) {
  const { colors } = useAppTheme()
  return <View style={[styles.row, { borderBottomColor: colors.border }]}>{children}</View>
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  title: { color: palette.muted, fontSize: 13, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
  footer: { color: palette.muted, fontSize: 13, marginTop: 6, marginHorizontal: 4 },
  group: { borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  flex: { flex: 1 },
  label: { fontSize: 16 },
  hint: { color: palette.muted, fontSize: 13, marginTop: 2 },
})
