package org.taxonworks.codereader

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.SystemClock
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.InputStream

/**
 * Options of `read`, read from a plain map. Not an Expo `Record`: in minified release builds R8
 * strips the Kotlin metadata a Record's reflection-based conversion needs, and every call failed
 * with a NullPointerException (debug builds were fine).
 */
private class ReadOptions(map: Map<String, Any?>) {
  val uri = map["uri"] as? String ?: ""
  val maxSide = (map["maxSide"] as? Number)?.toInt() ?: 4096
}

class ImageReadException(message: String) : CodedException(message)

/** Each quadrant covers this fraction of the width/height, so neighbours overlap by 20% */
private const val TILE_FRACTION = 0.6f

private const val TAG = "CodeReader"

/**
 * Reads barcodes and QR codes from an image file with Google ML Kit (on device, bundled model).
 * Coordinates are pixels of the analyzed (oriented, possibly downscaled) image.
 */
class CodeReaderModule : Module() {
  private val barcodeScanner by lazy { BarcodeScanning.getClient() }

  override fun definition() = ModuleDefinition {
    Name("CodeReader")

    // Runs off the main thread, so blocking on the ML Kit tasks is fine
    AsyncFunction("read") { optionsMap: Map<String, Any?> ->
      try {
        runRead(ReadOptions(optionsMap))
      } catch (e: Throwable) {
        // The JS error only carries the message: keep the native stack trace in the device log
        Log.e(TAG, "read failed", e)
        throw e
      }
    }

    OnDestroy {
      barcodeScanner.close()
    }
  }

  private fun runRead(options: ReadOptions): Map<String, Any?> {
    if (options.uri.isEmpty()) throw ImageReadException("uri must be provided")
    val started = SystemClock.elapsedRealtime()
    val bitmap = loadBitmap(options.uri, options.maxSide)
    val detection = detectBarcodes(bitmap)
    val result = mapOf(
      "engine" to "mlkit",
      "width" to bitmap.width,
      "height" to bitmap.height,
      "ms" to (SystemClock.elapsedRealtime() - started),
      "codes" to detection.barcodes,
      "pass" to detection.pass
    )
    bitmap.recycle()
    return result
  }

  private class BarcodeDetection(val barcodes: List<Map<String, Any?>>, val pass: String)

  /**
   * A still photo is a single attempt (live scanning gets dozens of frames per second), so try
   * several views of it and stop at the first that finds something:
   *  1. the full image                — small codes need every pixel
   *  2. half size                     — blur, noise and large codes decode better downscaled
   *  3. four overlapping quadrants    — tiny codes become relatively larger
   * Corners are always reported in full-image pixels.
   */
  private fun detectBarcodes(bitmap: Bitmap): BarcodeDetection {
    scan(bitmap, 1f, 0, 0).takeIf { it.isNotEmpty() }?.let { return BarcodeDetection(it, "full") }

    val half = Bitmap.createScaledBitmap(bitmap, bitmap.width / 2, bitmap.height / 2, true)
    try {
      scan(half, 2f, 0, 0).takeIf { it.isNotEmpty() }?.let { return BarcodeDetection(it, "half") }
    } finally {
      if (half != bitmap) half.recycle()
    }

    val tileW = (bitmap.width * TILE_FRACTION).toInt()
    val tileH = (bitmap.height * TILE_FRACTION).toInt()
    val found = linkedMapOf<String, Map<String, Any?>>()
    for (x in listOf(0, bitmap.width - tileW)) {
      for (y in listOf(0, bitmap.height - tileH)) {
        val tile = Bitmap.createBitmap(bitmap, x, y, tileW, tileH)
        try {
          // Quadrants overlap: the same code can show up twice
          scan(tile, 1f, x, y).forEach { found.putIfAbsent("${it["format"]}|${it["text"]}", it) }
        } finally {
          tile.recycle()
        }
      }
    }
    return BarcodeDetection(found.values.toList(), if (found.isEmpty()) "none" else "tiles")
  }

  private fun scan(bitmap: Bitmap, scale: Float, offsetX: Int, offsetY: Int): List<Map<String, Any?>> =
    Tasks.await(barcodeScanner.process(InputImage.fromBitmap(bitmap, 0))).mapNotNull { b ->
      val value = b.rawValue ?: b.displayValue
      if (value.isNullOrEmpty()) return@mapNotNull null
      mapOf(
        "text" to value,
        "format" to formatName(b.format),
        "corners" to (b.cornerPoints ?: emptyArray()).map {
          mapOf("x" to it.x * scale + offsetX, "y" to it.y * scale + offsetY)
        }
      )
    }

  /** Decode a file:// or content:// image, scaled so its longest side is at most maxSide, rotated per EXIF */
  private fun loadBitmap(path: String, maxSide: Int): Bitmap {
    val uri = if (path.startsWith("/")) Uri.fromFile(File(path)) else Uri.parse(path)

    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    open(uri).use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0) throw ImageReadException("Not a valid image: $path")

    var sample = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSide) sample *= 2
    val bitmap = open(uri).use {
      BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
    } ?: throw ImageReadException("Could not decode image: $path")

    val orientation = open(uri).use {
      ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    }
    val m = Matrix()
    // inSampleSize only divides by powers of two: finish the downscale exactly
    val longest = maxOf(bitmap.width, bitmap.height)
    if (longest > maxSide) {
      val scale = maxSide.toFloat() / longest
      m.postScale(scale, scale)
    }
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> m.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> m.postScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> { m.postRotate(90f); m.postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_TRANSVERSE -> { m.postRotate(270f); m.postScale(-1f, 1f) }
    }
    if (m.isIdentity) return bitmap
    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, m, true)
    if (rotated != bitmap) bitmap.recycle()
    return rotated
  }

  private fun open(uri: Uri): InputStream {
    val context = appContext.reactContext ?: throw ImageReadException("React context is not available")
    return context.contentResolver.openInputStream(uri) ?: throw ImageReadException("Cannot open $uri")
  }

  /** Canonical format names, the same on iOS and Android */
  private fun formatName(format: Int): String = when (format) {
    Barcode.FORMAT_QR_CODE -> "QRCode"
    Barcode.FORMAT_DATA_MATRIX -> "DataMatrix"
    Barcode.FORMAT_CODE_128 -> "Code128"
    Barcode.FORMAT_CODE_39 -> "Code39"
    Barcode.FORMAT_CODE_93 -> "Code93"
    Barcode.FORMAT_CODABAR -> "Codabar"
    Barcode.FORMAT_ITF -> "ITF"
    Barcode.FORMAT_EAN_13 -> "EAN-13"
    Barcode.FORMAT_EAN_8 -> "EAN-8"
    Barcode.FORMAT_UPC_A -> "UPC-A"
    Barcode.FORMAT_UPC_E -> "UPC-E"
    Barcode.FORMAT_PDF417 -> "PDF417"
    Barcode.FORMAT_AZTEC -> "Aztec"
    else -> "Unknown"
  }
}
