import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CodeReader from '@modules/code-reader'

import { APP_CONFIG } from '@/config'
import { useSettings } from '@/features/settings'
import { BusyOverlay, Icon, showToast } from '@/shared/components'
import {
  CameraMessage,
  CameraPreview,
  type CameraPreviewHandle,
  RoundButton,
  roundButtonStyles,
  useCameraAccess,
} from '@/shared/device/camera'
import { deleteFile } from '@/shared/device/files'
import { notify, tap } from '@/shared/device/haptics'
import { cameraColors } from '@/shared/theme'
import { messageOf } from '@/shared/utils/errors'

import { ConnectError, connectWithQr } from '../services/connect'
import { parseTaskQr, type TaskQr } from '../utils/taskQr'

const SHUTTER = 66
const BOTTOM_AREA = 150

type Props = { accept?: (qr: TaskQr) => boolean }

async function readCodes(preview: CameraPreviewHandle): Promise<string[]> {
  const photo = await preview.takePhoto()
  try {
    const result = await CodeReader.read({ uri: photo.uri })
    return result.codes.map((c) => c.text)
  } finally {
    // The photo is only needed to read the code
    deleteFile(photo.uri)
  }
}

/**
 * Scans the QR code shown by the app's TaxonWorks task (APP_CONFIG.taskName) and opens the session.
 * The code is read from a photo with the on-device code reader: live scanning isn't available on
 * Android with VisionCamera.
 * `accept` narrows which task QR codes are the app's (e.g. it needs one bound to a composition);
 * any other is treated as not a TaxonWorks QR code.
 */
export function ConnectScreen({ accept }: Props = {}) {
  const insets = useSafeAreaInsets()
  const serverUrl = useSettings((s) => s.serverUrl)
  const access = useCameraAccess()
  const camera = useRef<CameraPreviewHandle>(null)
  const [ready, setReady] = useState(false)
  const [busyMessage, setBusyMessage] = useState<string | null>(null)
  const canScan = !!serverUrl && access.hasPermission

  const readTaskQr = async (preview: CameraPreviewHandle): Promise<TaskQr | null> => {
    let values: string[]
    try {
      values = await readCodes(preview)
    } catch (e) {
      Alert.alert('Could not read the QR code', messageOf(e, 'Try again.'))
      return null
    }

    const qr = values.map(parseTaskQr).find((v) => v !== null && (!accept || accept(v)))
    if (!qr) {
      notify('error')
      showToast(
        values.length ? 'That is not a TaxonWorks QR code' : 'No QR code found. Move closer and try again.',
      )
      return null
    }
    return qr
  }

  const openSession = async (qr: TaskQr): Promise<boolean> => {
    try {
      await connectWithQr(qr)
    } catch (e) {
      notify('error')
      Alert.alert('Could not connect', e instanceof ConnectError ? e.message : String(e))
      return false
    }
    notify('success')
    showToast('Connected to TaxonWorks')
    router.back()
    return true
  }

  const scan = async () => {
    if (!camera.current || busyMessage) return
    setBusyMessage('Reading the QR code…')
    const qr = await readTaskQr(camera.current)
    if (qr) {
      setBusyMessage('Connecting…')
      if (await openSession(qr)) return
    }
    setBusyMessage(null)
  }

  const renderCamera = () => {
    if (!serverUrl) {
      return <CameraMessage text="Set your TaxonWorks server in Settings before connecting." />
    }
    if (!access.hasPermission) {
      return (
        <CameraMessage
          text="The camera is used to scan the QR code shown by TaxonWorks."
          action={access.canRequestPermission ? 'Allow camera' : 'Open settings'}
          onAction={access.requestAgain}
        />
      )
    }
    return (
      <CameraPreview
        ref={camera}
        light="off"
        aspect="full"
        active={access.visible}
        onReadyChange={setReady}
        onError={(e) => Alert.alert('Camera error', e.message)}
        bottomInset={BOTTOM_AREA + insets.bottom}
      />
    )
  }

  return (
    <View style={styles.screen}>
      {renderCamera()}

      {canScan && <View style={styles.qrFrame} pointerEvents="none" />}

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <RoundButton icon="close" label="Close" onPress={() => router.back()} />
        <Text style={styles.hint}>
          Open {APP_CONFIG.taskName} in TaxonWorks, frame its QR code and tap the button.
        </Text>
      </View>

      {canScan && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            onPress={() => void scan()}
            onPressIn={tap}
            disabled={!ready || !!busyMessage}
            accessibilityRole="button"
            accessibilityLabel="Scan QR code"
            style={({ pressed }) => [
              styles.shutter,
              !ready && roundButtonStyles.disabled,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Icon name="codes" size={30} color={cameraColors.background} />
          </Pressable>
        </View>
      )}

      {busyMessage && <BusyOverlay message={busyMessage} />}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cameraColors.background },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: {
    flex: 1,
    color: cameraColors.foreground,
    fontSize: 14,
    textShadowColor: cameraColors.textShadow,
    textShadowRadius: 4,
  },
  qrFrame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: cameraColors.guide,
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
    backgroundColor: cameraColors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
