import CoreImage
import ExpoModulesCore
import UIKit
import Vision

struct ReadOptions: Record {
  @Field var uri: String = ""
  @Field var maxSide: Double = 4096
}

final class ImageReadException: GenericException<String> {
  override var reason: String { "Could not read image: \(param)" }
}

/**
 * Reads barcodes and QR codes from an image file with Apple Vision (on device).
 * Coordinates are pixels of the analyzed (oriented, possibly downscaled) image, origin top-left.
 */
public class CodeReaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CodeReader")

    // AsyncFunction runs on a background queue, so the synchronous Vision calls are fine
    AsyncFunction("read") { (options: ReadOptions) -> [String: Any] in
      let started = Date()
      guard let image = Self.loadImage(options.uri),
            let cgImage = Self.normalized(image, maxSide: CGFloat(options.maxSide)) else {
        throw ImageReadException(options.uri)
      }
      let detection = try Self.detectBarcodes(cgImage)
      return [
        "engine": "apple-vision",
        "width": CGFloat(cgImage.width),
        "height": CGFloat(cgImage.height),
        "ms": Int(Date().timeIntervalSince(started) * 1000),
        "codes": detection.barcodes,
        "pass": detection.pass
      ]
    }
  }

  /// Each quadrant covers this fraction of the width/height, so neighbours overlap by 20%
  private static let tileFraction: CGFloat = 0.6

  /**
   * A still photo is a single attempt (live scanning gets dozens of frames per second), so try
   * several views of it and stop at the first that finds something: the full image, slightly
   * blurred (merges the dot-matrix print and sensor noise of printed codes), half size
   * (blur, noise and large codes decode better downscaled) and four overlapping quadrants (tiny
   * codes become relatively larger). Corners are always reported in full-image pixels.
   */
  private static func detectBarcodes(_ image: CGImage) throws -> (barcodes: [[String: Any]], pass: String) {
    let full = try scan(image, scale: 1, offset: .zero)
    if !full.isEmpty { return (full, "full") }

    if let soft = smoothed(image) {
      let found = try scan(soft, scale: 1, offset: .zero)
      if !found.isEmpty { return (found, "smoothed") }
    }

    let halfSize = CGSize(width: image.width / 2, height: image.height / 2)
    if let half = resized(image, to: halfSize) {
      let found = try scan(half, scale: 2, offset: .zero)
      if !found.isEmpty { return (found, "half") }
    }

    let tileW = Int(CGFloat(image.width) * tileFraction)
    let tileH = Int(CGFloat(image.height) * tileFraction)
    var seen = Set<String>()
    var found: [[String: Any]] = []
    for x in [0, image.width - tileW] {
      for y in [0, image.height - tileH] {
        guard let tile = image.cropping(to: CGRect(x: x, y: y, width: tileW, height: tileH)) else { continue }
        for barcode in try scan(tile, scale: 1, offset: CGPoint(x: x, y: y)) {
          // Quadrants overlap: the same code can show up twice
          let key = "\(barcode["format"] ?? "")|\(barcode["text"] ?? "")"
          if seen.insert(key).inserted { found.append(barcode) }
        }
      }
    }
    return (found, found.isEmpty ? "none" : "tiles")
  }

  /// Barcodes in `image`, with corners mapped to the full image: `point * scale + offset`
  private static func scan(_ image: CGImage, scale: CGFloat, offset: CGPoint) throws -> [[String: Any]] {
    let request = VNDetectBarcodesRequest()
    #if targetEnvironment(simulator)
    // The simulator has no Neural Engine: the ML-based revisions (3+) fail with "Could not create
    // inference context" or find nothing, and revision 2 only works when pinned to the CPU
    request.revision = VNDetectBarcodesRequestRevision2
    if #available(iOS 17.0, *) {
      for (stage, devices) in (try? request.supportedComputeStageDevices) ?? [:] {
        if let cpu = devices.first(where: { if case .cpu = $0 { true } else { false } }) {
          request.setComputeDevice(cpu, for: stage)
        }
      }
    } else {
      request.usesCPUOnly = true
    }
    #endif
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])

    let w = CGFloat(image.width)
    let h = CGFloat(image.height)
    // Vision uses normalized coordinates with the origin at the bottom-left
    func point(_ p: CGPoint) -> [String: Any] {
      ["x": p.x * w * scale + offset.x, "y": (1 - p.y) * h * scale + offset.y]
    }

    var seen = Set<String>()
    var barcodes: [[String: Any]] = []
    for o in request.results ?? [] {
      guard let value = o.payloadStringValue, !value.isEmpty else { continue }
      let format = formatName(o.symbology)
      // Vision may report the same symbol more than once
      guard seen.insert("\(format)|\(value)").inserted else { continue }
      barcodes.append([
        "text": value,
        "format": format,
        "corners": [point(o.topLeft), point(o.topRight), point(o.bottomRight), point(o.bottomLeft)]
      ])
    }
    return barcodes
  }

  private static let ciContext = CIContext()

  /// Light Gaussian blur, scaled with resolution (sigma 1 at ~2000 px)
  private static func smoothed(_ image: CGImage) -> CGImage? {
    let input = CIImage(cgImage: image)
    let sigma = max(1, Double(max(image.width, image.height)) / 2000)
    let output = input.clampedToExtent().applyingGaussianBlur(sigma: sigma).cropped(to: input.extent)
    return ciContext.createCGImage(output, from: input.extent)
  }

  private static func resized(_ image: CGImage, to size: CGSize) -> CGImage? {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    return UIGraphicsImageRenderer(size: size, format: format).image { _ in
      UIImage(cgImage: image).draw(in: CGRect(origin: .zero, size: size))
    }.cgImage
  }

  private static func loadImage(_ path: String) -> UIImage? {
    let url = path.hasPrefix("/") ? URL(fileURLWithPath: path) : URL(string: path)
    guard let url = url, let data = try? Data(contentsOf: url) else { return nil }
    return UIImage(data: data)
  }

  /** Redraw upright (applies EXIF orientation) and downscale so the longest side is <= maxSide */
  private static func normalized(_ image: UIImage, maxSide: CGFloat) -> CGImage? {
    let size = image.size
    let scale = min(1, maxSide / max(size.width, size.height))
    if image.imageOrientation == .up, scale == 1 { return image.cgImage }
    let target = CGSize(width: floor(size.width * scale), height: floor(size.height * scale))
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let rendered = UIGraphicsImageRenderer(size: target, format: format).image { _ in
      image.draw(in: CGRect(origin: .zero, size: target))
    }
    return rendered.cgImage
  }

  /** Canonical format names, the same on iOS and Android */
  private static func formatName(_ s: VNBarcodeSymbology) -> String {
    switch s {
    case .qr: return "QRCode"
    case .microQR: return "MicroQRCode"
    case .dataMatrix: return "DataMatrix"
    case .code128: return "Code128"
    case .code39, .code39Checksum, .code39FullASCII, .code39FullASCIIChecksum: return "Code39"
    case .code93, .code93i: return "Code93"
    case .codabar: return "Codabar"
    case .itf14, .i2of5, .i2of5Checksum: return "ITF"
    case .ean13: return "EAN-13"
    case .ean8: return "EAN-8"
    case .upce: return "UPC-E"
    case .pdf417, .microPDF417: return "PDF417"
    case .aztec: return "Aztec"
    default: return s.rawValue
    }
  }
}
