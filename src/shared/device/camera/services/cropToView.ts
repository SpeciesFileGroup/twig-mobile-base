import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

import { deleteFile } from '@/shared/device/files'

import { coverCrop } from '../utils/aspect'

const JPEG_QUALITY = 0.95

/**
 * Crops a captured photo to what the full-screen preview showed. The original file is deleted.
 * Returns the new photo with its size.
 */
export async function cropToView(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  viewWidth: number,
  viewHeight: number,
): Promise<{ uri: string; width: number; height: number }> {
  const rect = coverCrop(photoWidth, photoHeight, viewWidth, viewHeight)
  if (!rect) return { uri, width: photoWidth, height: photoHeight }

  const image = await ImageManipulator.manipulate(uri).crop(rect).renderAsync()
  const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG })

  deleteFile(uri)

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
  }
}
