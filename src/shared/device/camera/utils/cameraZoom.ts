/**
 * Zoom of the camera, as a real magnification factor of the main (wide-angle) lens:
 * 1 = no zoom. VisionCamera reports the device's range; digital zoom beyond `MAX_USEFUL_ZOOM` only
 * enlarges noise, so the range is capped there.
 */
export const MAX_USEFUL_ZOOM = 10

export type ZoomRange = {
  min: number
  max: number
}

export function zoomRange(device: { minZoom: number; maxZoom: number } | undefined): ZoomRange {
  if (!device)
    return {
      min: 1,
      max: 1,
    }

  const min = Math.max(1, device.minZoom)

  return {
    min,
    max: Math.max(min, Math.min(device.maxZoom, MAX_USEFUL_ZOOM)),
  }
}

export const clampZoom = (zoom: number, range: ZoomRange) => Math.min(range.max, Math.max(range.min, zoom))

/** Zoom after a pinch that started at `start` and is now at `scale` (1 = unchanged): follows the fingers */
export function pinchZoom(start: number, scale: number, range: ZoomRange): number {
  return clampZoom(scale > 0 ? start * scale : start, range)
}

/** Zoom rounded to what its label shows (one decimal) */
export const roundZoom = (zoom: number) => Math.round(zoom * 10) / 10

/** Label for a zoom factor: "1×", "2.4×", "10×" */
export function formatZoom(zoom: number): string {
  const rounded = roundZoom(zoom)
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}×`
}

/**
 * Errors CameraX reports when an operation is replaced by a newer one before finishing, e.g.
 * "Cancelled due to another zoom value being set" for every intermediate value of a pinch.
 */
export const isSuperseded = (error: Error) =>
  /Cancelled due to another|OperationCanceledException/i.test(`${error.name} ${error.message}`)
