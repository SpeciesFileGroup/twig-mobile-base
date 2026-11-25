import { SessionSection } from '@/features/auth'
import { SettingsScreen } from '@/features/settings'

export default function SettingsRoute() {
  return <SettingsScreen session={<SessionSection />} />
}

export { ScreenError as ErrorBoundary } from '@/shared/components'
