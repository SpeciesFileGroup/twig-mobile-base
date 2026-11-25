import {
  clampZoom,
  formatZoom,
  isSuperseded,
  MAX_USEFUL_ZOOM,
  pinchZoom,
  roundZoom,
  zoomRange,
} from '../utils/cameraZoom'

describe('zoomRange', () => {
  it('starts at the main lens (1×) and caps digital zoom', () => {
    expect(zoomRange({ minZoom: 0.5, maxZoom: 100 })).toEqual({ min: 1, max: MAX_USEFUL_ZOOM })
    expect(zoomRange({ minZoom: 1, maxZoom: 4 })).toEqual({ min: 1, max: 4 })
  })

  it('allows no zoom while the camera is not known yet', () => {
    expect(zoomRange(undefined)).toEqual({ min: 1, max: 1 })
  })
})

describe('pinchZoom', () => {
  const range = { min: 1, max: 8 }

  it('follows the finger spread from where the pinch started', () => {
    expect(pinchZoom(1, 2, range)).toBe(2)
    expect(pinchZoom(3, 0.5, range)).toBe(1.5)
    expect(pinchZoom(2, 1, range)).toBe(2)
  })

  it('stays within the range', () => {
    expect(pinchZoom(2, 0.1, range)).toBe(1)
    expect(pinchZoom(4, 5, range)).toBe(8)
    expect(pinchZoom(3, 0, range)).toBe(3)
  })
})

describe('clampZoom', () => {
  it('keeps the zoom within the range', () => {
    expect(clampZoom(0.5, { min: 1, max: 4 })).toBe(1)
    expect(clampZoom(2.5, { min: 1, max: 4 })).toBe(2.5)
    expect(clampZoom(9, { min: 1, max: 4 })).toBe(4)
  })
})

describe('roundZoom', () => {
  it('rounds to the decimal the label shows', () => {
    expect(roundZoom(1.04)).toBe(1)
    expect(roundZoom(2.36)).toBe(2.4)
  })
})

describe('formatZoom', () => {
  it('shows whole factors without decimals and others with one', () => {
    expect(formatZoom(1)).toBe('1×')
    expect(formatZoom(2.04)).toBe('2×')
    expect(formatZoom(2.36)).toBe('2.4×')
    expect(formatZoom(10)).toBe('10×')
  })
})

describe('isSuperseded', () => {
  it('recognizes zoom values replaced while pinching', () => {
    expect(isSuperseded(new Error('Cancelled due to another zoom value being set.'))).toBe(true)
    expect(
      isSuperseded(
        new Error('androidx.camera.core.CameraControl$OperationCanceledException: Camera is closed'),
      ),
    ).toBe(true)
  })

  it('keeps real problems', () => {
    expect(isSuperseded(new Error('No flash unit'))).toBe(false)
  })
})
