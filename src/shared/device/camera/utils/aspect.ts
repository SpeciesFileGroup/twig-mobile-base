/**
 * Aspect of the photos (width:height, portrait). "3:4" is the whole sensor frame (no crop, full
 * resolution); "full" matches the phone screen; the others are crops of the sensor frame.
 */
export type CaptureAspect = 'full' | '3:4' | '9:16' | '1:1'

/** Order of the aspect button, starting from the default */
export const CAPTURE_ASPECTS: readonly CaptureAspect[] = ['full', '3:4', '9:16', '1:1']

const RATIO: Record<Exclude<CaptureAspect, 'full'>, number> = { '3:4': 3 / 4, '9:16': 9 / 16, '1:1': 1 }

export type Box = {
  left: number
  top: number
  width: number
  height: number
}

/** Where the preview goes in a view of this size: as large as fits, centered (the whole view for "full") */
export function previewBox(aspect: CaptureAspect, width: number, height: number): Box {
  if (aspect === 'full' || !(width > 0 && height > 0)) return { left: 0, top: 0, width, height }
  const ratio = RATIO[aspect]
  const boxWidth = Math.min(width, height * ratio)
  const boxHeight = boxWidth / ratio

  return {
    left: (width - boxWidth) / 2,
    top: (height - boxHeight) / 2,
    width: boxWidth,
    height: boxHeight,
  }
}

export type CropRect = { originX: number; originY: number; width: number; height: number }

/**
 * Part of a photo that a preview of `viewWidth`×`viewHeight` shows when it fills the view ('cover'):
 * centered, with the view's aspect. Null when the photo already has that aspect.
 */
export function coverCrop(
  photoWidth: number,
  photoHeight: number,
  viewWidth: number,
  viewHeight: number,
): CropRect | null {
  if (!(photoWidth > 0 && photoHeight > 0 && viewWidth > 0 && viewHeight > 0)) return null
  const viewAspect = viewWidth / viewHeight
  const photoAspect = photoWidth / photoHeight
  if (Math.abs(viewAspect - photoAspect) < 0.01) return null

  if (viewAspect < photoAspect) {
    const width = Math.round(photoHeight * viewAspect)

    return {
      originX: Math.round((photoWidth - width) / 2),
      originY: 0,
      width,
      height: photoHeight,
    }
  }
  const height = Math.round(photoWidth / viewAspect)

  return {
    originX: 0,
    originY: Math.round((photoHeight - height) / 2),
    width: photoWidth,
    height,
  }
}
