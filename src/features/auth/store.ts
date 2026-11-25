import { create } from 'zustand'

import { useSettings } from '@/features/settings'

import type { Session } from './types'

type SessionState = { session: Session | null }

export const useSession = create<SessionState>(() => ({ session: null }))

export function startSession(session: Session) {
  useSession.setState({ session })
}

export function endSession() {
  useSession.setState({ session: null })
}

export function getSession(now = Date.now()): Session | null {
  const { session } = useSession.getState()
  if (!session) return null
  if (now >= session.expiresAt) {
    endSession()
    return null
  }
  return session
}

useSettings.subscribe((state, previous) => {
  if (state.serverUrl !== previous.serverUrl) endSession()
})
