import { type RefObject, useRef, useState } from 'react'
import { usePinchGesture } from 'react-native-gesture-handler'
import type { CameraRef } from 'react-native-vision-camera'

import { clampZoom, isSuperseded, pinchZoom, type ZoomRange, zoomRange } from '../utils/cameraZoom'

type ZoomLimits = { minZoom: number; maxZoom: number }

/** The current zoom factor, readable and observable outside React state (see ZoomControl) */
export type ZoomValue = { get: () => number; subscribe: (listener: () => void) => () => void }

function createZoomValue() {
  let current = 1
  const listeners = new Set<() => void>()
  return {
    get: () => current,
    set: (next: number) => {
      current = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/**
 * Pinch to zoom. The zoom changes on every frame of a pinch, so it is not React state: each value
 * goes straight to the camera controller, and the preview doesn't re-render while pinching. Only
 * ZoomControl does, when its label changes.
 */
export function usePinchZoom(
  camera: RefObject<CameraRef | null>,
  device: ZoomLimits | undefined,
  onError: (error: Error) => void,
) {
  const [sessionLimits, setSessionLimits] = useState<ZoomLimits | null>(null)
  const [pinching, setPinching] = useState(false)
  const [zoom] = useState(createZoomValue)
  const value: ZoomValue = zoom
  const running = useRef(false)
  const pinchRange = useRef(zoomRange(device))
  const pinchStart = useRef(1)

  const readSessionLimits = (): ZoomLimits | null => {
    const controller = camera.current?.controller
    if (!controller) return null
    const limits = { minZoom: controller.minZoom, maxZoom: controller.maxZoom }
    setSessionLimits(limits)
    return limits
  }

  const apply = (next: number, range: ZoomRange) => {
    zoom.set(next)
    if (!running.current) return
    camera.current?.controller?.setZoom(clampZoom(next, range)).catch((e: unknown) => {
      const error = e instanceof Error ? e : new Error(String(e))
      if (!isSuperseded(error)) onError(error)
    })
  }

  /** Call when the camera starts or stops: a (re)started camera gets the current zoom */
  const onRunningChange = (isRunning: boolean) => {
    running.current = isRunning
    if (isRunning) apply(zoom.get(), zoomRange(readSessionLimits() ?? sessionLimits ?? device))
  }

  const gesture = usePinchGesture({
    runOnJS: true,
    onActivate: () => {
      pinchRange.current = zoomRange(readSessionLimits() ?? sessionLimits ?? device)
      pinchStart.current = zoom.get()
      setPinching(true)
    },
    onUpdate: (e) => apply(pinchZoom(pinchStart.current, e.scale, pinchRange.current), pinchRange.current),
    onFinalize: () => setPinching(false),
  })

  return {
    gesture,
    value,
    pinching,
    reset: () => apply(1, zoomRange(sessionLimits ?? device)),
    onRunningChange,
  }
}
