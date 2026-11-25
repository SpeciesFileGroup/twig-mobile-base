import { Storage } from 'expo-sqlite/kv-store'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import { DEFAULT_SETTINGS, type Settings } from './types'

// Synchronous storage so settings are available on the first render (no hydration flash)
const kvStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key)
  },
}

type SettingsState = Settings & { update: (patch: Partial<Settings>) => void }

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => kvStorage),
      partialize: ({ update: _update, ...settings }) => settings,
    },
  ),
)

export const getSettings = (): Settings => useSettings.getState()
export const updateSettings = (patch: Partial<Settings>) => useSettings.getState().update(patch)
