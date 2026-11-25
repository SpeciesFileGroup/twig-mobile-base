import { type Ref, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { GestureDetector, useCompetingGestures } from 'react-native-gesture-handler'
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated'
import { Camera, type CameraRef, useCameraDevice, usePhotoOutput } from 'react-native-vision-camera'

import { cameraColors } from '@/shared/components'

import { Rotatable } from './Rotatable'
import { ZoomControl } from './ZoomControl'
import { usePinchZoom } from '../hooks/usePinchZoom'
import { useTapToFocus } from '../hooks/useTapToFocus'
import { cropToView } from '../services/cropToView'
import { type CaptureAspect, previewBox } from '../utils/aspect'
import { isSuperseded } from '../utils/cameraZoom'

export type Light = 'off' | 'flash' | 'torch'

export type CapturedPhoto = { uri: string; width: number; height: number }

export type CameraPreviewHandle = {
  takePhoto: () => Promise<CapturedPhoto>
}

type Props = {
  light: Light
  aspect: CaptureAspect
  active: boolean
  onReadyChange: (ready: boolean) => void
  onError: (error: Error) => void
  onUIRotationChange?: (rotation: number) => void
  bottomInset: number
  ref?: Ref<CameraPreviewHandle>
}

const FOCUS_RING = 72
const ZOOM_CHIP_GAP = 10

const toFileUri = (path: string) => (path.startsWith('file://') ? path : `file://${path}`)

export function CameraPreview({
  light,
  aspect,
  active,
  onReadyChange,
  onError,
  onUIRotationChange,
  bottomInset,
  ref,
}: Props) {
  const device = useCameraDevice('back', { physicalDevices: ['wide-angle'] })
  const photoOutput = usePhotoOutput({
    containerFormat: 'jpeg',
    qualityPrioritization: 'quality',
    quality: 0.95,
  })
  const camera = useRef<CameraRef>(null)
  const [started, setStarted] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const box = previewBox(aspect, size.width, size.height)

  const zoom = usePinchZoom(camera, device, onError)
  const focus = useTapToFocus(camera, { enabled: started && !!device?.supportsFocusMetering, area: box })
  const gestures = useCompetingGestures(zoom.gesture, focus.gesture)

  const setRunning = (running: boolean) => {
    setStarted(running)
    zoom.onRunningChange(running)
    onReadyChange(running)
  }

  useImperativeHandle(
    ref,
    () => ({
      async takePhoto() {
        const file = await photoOutput.capturePhotoToFile(
          { flashMode: light === 'flash' && device?.hasFlash ? 'on' : 'off' },
          {},
        )
        const sideways = file.orientation === 'left' || file.orientation === 'right'
        const photo = {
          uri: toFileUri(file.filePath),
          width: sideways ? file.height : file.width,
          height: sideways ? file.width : file.height,
        }

        const landscape = photo.width > photo.height
        return cropToView(
          photo.uri,
          photo.width,
          photo.height,
          landscape ? box.height : box.width,
          landscape ? box.width : box.height,
        )
      },
    }),
    [box.height, box.width, device, light, photoOutput],
  )

  if (!device) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>No camera available</Text>
      </View>
    )
  }

  const canSetTorch = started && device.hasTorch
  const torchMode = light === 'torch' ? 'on' : 'off'
  const { focusPoint } = focus

  return (
    <>
      <GestureDetector gesture={gestures}>
        <View style={StyleSheet.absoluteFill} onLayout={(e) => setSize(e.nativeEvent.layout)}>
          <Camera
            ref={camera}
            style={[styles.box, { left: box.left, top: box.top, width: box.width, height: box.height }]}
            resizeMode="cover"
            device={device}
            isActive={active}
            outputs={[photoOutput]}
            torchMode={canSetTorch ? torchMode : undefined}
            onUIRotationChanged={(rotation) => onUIRotationChange?.(-rotation)}
            onStarted={() => setRunning(true)}
            onStopped={() => setRunning(false)}
            onError={(error) => {
              if (isSuperseded(error)) return
              onError(error)
            }}
          />
          <View pointerEvents="none" style={[styles.mask, { top: 0, height: box.top }]} />
          <View pointerEvents="none" style={[styles.mask, { top: box.top + box.height, bottom: 0 }]} />
          {box.left > 0 && (
            <>
              <View pointerEvents="none" style={[styles.maskSide, { left: 0, width: box.left }]} />
              <View pointerEvents="none" style={[styles.maskSide, { right: 0, width: box.left }]} />
            </>
          )}
          {focusPoint && (
            <Animated.View
              key={focusPoint.id}
              entering={ZoomIn.duration(180)}
              exiting={FadeOut.duration(200)}
              pointerEvents="none"
              style={[
                styles.focusRing,
                { left: focusPoint.x - FOCUS_RING / 2, top: focusPoint.y - FOCUS_RING / 2 },
              ]}
            />
          )}
        </View>
      </GestureDetector>
      <View style={[styles.zoom, { bottom: bottomInset + ZOOM_CHIP_GAP }]} pointerEvents="box-none">
        <Rotatable>
          <ZoomControl value={zoom.value} pinching={zoom.pinching} onReset={zoom.reset} />
        </Rotatable>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  missing: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  box: { position: 'absolute' },
  mask: { position: 'absolute', left: 0, right: 0, backgroundColor: cameraColors.background },
  maskSide: { position: 'absolute', top: 0, bottom: 0, backgroundColor: cameraColors.background },
  missingText: { color: cameraColors.foreground, fontSize: 16 },
  focusRing: {
    position: 'absolute',
    width: FOCUS_RING,
    height: FOCUS_RING,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: cameraColors.focusRing,
  },
  zoom: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
})
