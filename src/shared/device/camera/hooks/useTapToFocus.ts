import { type RefObject, useEffect, useRef, useState } from 'react'
import { useTapGesture } from 'react-native-gesture-handler'
import type { CameraRef } from 'react-native-vision-camera'

import type { Box } from '../utils/aspect'

const FOCUS_RING_MS = 1200
const FOCUS_HOLD_SECONDS = 8

type FocusPoint = { x: number; y: number; id: number }

export function useTapToFocus(
  camera: RefObject<CameraRef | null>,
  { enabled, area }: { enabled: boolean; area: Box },
) {
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null)
  const ringTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(ringTimer.current), [])

  const gesture = useTapGesture({
    runOnJS: true,
    onActivate: (e) => {
      if (!enabled) return
      const point = { x: e.x - area.left, y: e.y - area.top }
      const insideArea = point.x >= 0 && point.y >= 0 && point.x <= area.width && point.y <= area.height
      if (!insideArea) return

      setFocusPoint({ x: e.x, y: e.y, id: Date.now() })
      clearTimeout(ringTimer.current)
      ringTimer.current = setTimeout(() => setFocusPoint(null), FOCUS_RING_MS)
      camera.current
        ?.focusTo(point, { adaptiveness: 'locked', autoResetAfter: FOCUS_HOLD_SECONDS })
        .catch((err: unknown) => console.warn('Focus failed', err))
    },
  })

  return { gesture, focusPoint }
}
