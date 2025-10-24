// Barcode generation and scanning utilities
export const generateBarcodeData = (rumahId: string, alamat: string): string => {
  // Generate a unique barcode string based on house data
  const timestamp = Date.now().toString(36)
  const houseCode = rumahId.padStart(3, "0")
  return `RMH${houseCode}${timestamp.slice(-4)}`
}

export const generateBarcodeUrl = (data: string): string => {
  // Using a barcode generation service - in production, use a proper barcode library
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}

export const validateBarcodeFormat = (barcode: string): boolean => {
  // Validate barcode format: RMH + 3 digits + 4 alphanumeric
  const pattern = /^RMH\d{3}[A-Za-z0-9]{4}$/
  return pattern.test(barcode)
}

export const parseBarcodeData = (barcode: string): { rumahId: string; isValid: boolean } => {
  if (!validateBarcodeFormat(barcode)) {
    return { rumahId: "", isValid: false }
  }

  // Extract house ID from barcode (characters 3-6)
  const rumahId = barcode.substring(3, 6).replace(/^0+/, "") || "1"
  return { rumahId, isValid: true }
}

// Mock barcode scanner - in production, integrate with camera API
export const scanBarcode = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    // Simulate barcode scanning delay
    setTimeout(() => {
      // Return a mock barcode for testing
      const mockBarcodes = ["RMH001ABC1", "RMH002DEF2", "RMH003GHI3"]
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
      resolve(randomBarcode)
    }, 2000)
  })
}
