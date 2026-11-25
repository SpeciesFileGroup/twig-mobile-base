export type Point = { x: number; y: number }

export type ReadOptions = {
  /** file:// (or content:// on Android) URI of the image */
  uri: string
  /** Longest side of the image that is analyzed (default 4096) */
  maxSide?: number
}

export type ReadCode = { text: string; format: string; corners: Point[] }

export type ReadResult = {
  engine: 'mlkit' | 'apple-vision'
  /** Size of the analyzed (oriented, possibly downscaled) image; corners are in these pixels */
  width: number
  height: number
  ms: number
  codes: ReadCode[]
  /** Which view of the photo found the codes: full image, blurred (iOS only), half size, quadrants, or none */
  pass: 'full' | 'smoothed' | 'half' | 'tiles' | 'none'
}
