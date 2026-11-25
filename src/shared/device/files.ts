import { File } from 'expo-file-system'

export function deleteFile(uri: string) {
  try {
    const file = new File(uri)
    if (file.exists) file.delete()
  } catch (e) {
    console.warn('Could not delete file', uri, e)
  }
}
