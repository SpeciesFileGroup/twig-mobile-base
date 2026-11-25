import { useIsFocused } from 'expo-router/react-navigation'
import { useEffect, useRef, useState } from 'react'
import { AppState, Linking } from 'react-native'
import { useCameraPermission } from 'react-native-vision-camera'

/**
 * What a camera screen needs before showing the preview: the permission (asked once on opening; after a
 * denial, `requestAgain` opens the system settings) and whether the camera may run, which it only does
 * while the screen is shown and the app is in the foreground.
 */
export function useCameraAccess() {
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission()

  const asked = useRef(false)
  useEffect(() => {
    if (hasPermission || !canRequestPermission || asked.current) return
    asked.current = true
    void requestPermission()
  }, [hasPermission, canRequestPermission, requestPermission])

  const focused = useIsFocused()
  const [foreground, setForeground] = useState(AppState.currentState === 'active')
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setForeground(state === 'active'))
    return () => sub.remove()
  }, [])

  const requestAgain = () => {
    if (canRequestPermission) void requestPermission()
    else void Linking.openSettings()
  }

  return {
    hasPermission,
    canRequestPermission,
    requestAgain,
    visible: focused && foreground,
  }
}
