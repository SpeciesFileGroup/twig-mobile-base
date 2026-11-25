import { NativeModule, requireNativeModule } from 'expo'

import type { ReadOptions, ReadResult } from './CodeReader.types'

declare class CodeReaderModule extends NativeModule<{}> {
  /** Barcodes and QR codes in an image, on device (ML Kit on Android, Apple Vision on iOS) */
  read(options: ReadOptions): Promise<ReadResult>
}

export default requireNativeModule<CodeReaderModule>('CodeReader')
