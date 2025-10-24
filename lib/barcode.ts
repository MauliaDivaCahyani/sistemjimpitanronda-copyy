export const generateBarcodeData = (rumahId: string, alamat: string): string => {
  const timestamp = Date.now().toString(36)
const houseCode = rumahId.toString().padStart(3, "0")
  return `RMH${houseCode}${timestamp.slice(-4)}`
}

export const generateBarcodeUrl = (data: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}

export const validateBarcodeFormat = (barcode: string): boolean => {
  const pattern = /^RMH\d{3}[A-Za-z0-9]{4}$/
  return pattern.test(barcode)
}

export const parseBarcodeData = (barcode: string): { rumahId: string; isValid: boolean } => {
  if (!validateBarcodeFormat(barcode)) {
    return { rumahId: "", isValid: false }
  }

  const rumahId = barcode.substring(3, 6).replace(/^0+/, "") || "1"
  return { rumahId, isValid: true }
}

export const scanBarcode = async (): Promise<string | null> => {
  try {
    // Hindari SSR error dengan dynamic import
    const { Html5QrcodeScanner } = await import("html5-qrcode")

    return new Promise((resolve, reject) => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      )

      let scanned = false

      scanner.render(
        (decodedText) => {
          if (!scanned) {
            scanned = true
            scanner.clear()
            resolve(decodedText)
          }
        },
        (error) => {
          if (!scanned) {
            console.log("[v0] QR scan error:", error)
          }
        },
      )

      // Auto stop setelah 30 detik
      setTimeout(() => {
        if (!scanned) {
          scanner.clear()
          resolve(null)
        }
      }, 30000)
    })
  } catch (error) {
    console.error("[v0] Failed to initialize barcode scanner:", error)
    return null
  }
}
