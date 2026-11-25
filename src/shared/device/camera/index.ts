/**
 * Full-screen camera (VisionCamera): pinch to zoom, tap to focus, photos cropped to what the preview
 * shows. Used to scan the TaxonWorks QR code; apps can use it for their own photos.
 */
export { CameraMessage } from './components/CameraMessage'
export {
  type CameraPreviewHandle,
  CameraPreview,
  type CapturedPhoto,
  type Light,
} from './components/CameraPreview'
export { Rotatable, UIRotationContext } from './components/Rotatable'
export { RoundButton, roundButtonStyles } from './components/RoundButton'
export { useCameraAccess } from './hooks/useCameraAccess'
export { CAPTURE_ASPECTS, type CaptureAspect } from './utils/aspect'
