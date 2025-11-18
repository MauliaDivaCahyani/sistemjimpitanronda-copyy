export const generateBarcodeData = (rumahId: string, alamat: string): string => {
  // Generate barcode tetap berdasarkan ID rumah saja (tanpa timestamp)
  // Format: RMH + 3 digit ID + 4 karakter hash dari alamat
  const houseCode = rumahId.toString().padStart(3, "0")
  
  // Buat hash sederhana dari alamat untuk uniqueness
  let hash = 0
  for (let i = 0; i < alamat.length; i++) {
    hash = ((hash << 5) - hash) + alamat.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(36).substring(0, 4).toUpperCase().padEnd(4, '0')
  
  return `RMH${houseCode}${hashStr}`
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
