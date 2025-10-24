"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { scanBarcode, parseBarcodeData } from "@/lib/barcode"
import { getWargaByBarcode } from "@/lib/database"
import { Camera, Scan, User, MapPin, Phone, AlertCircle, CheckCircle } from "lucide-react"
import type { Warga } from "@/types/database"

interface BarcodeScannerProps {
  onWargaFound: (warga: Warga) => void
}

export function BarcodeScanner({ onWargaFound }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [scannedWarga, setScannedWarga] = useState<Warga | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleScanBarcode = async () => {
    setIsScanning(true)
    setError("")
    setSuccess("")

    try {
      const scannedCode = await scanBarcode()
      if (scannedCode) {
        await processBarcode(scannedCode)
      } else {
        setError("Gagal memindai barcode. Silakan coba lagi.")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memindai barcode.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleManualInput = async () => {
    if (!manualBarcode.trim()) {
      setError("Silakan masukkan kode barcode.")
      return
    }

    setError("")
    setSuccess("")
    await processBarcode(manualBarcode.trim())
  }

  const processBarcode = async (barcodeData: string) => {
    const { rumahId, isValid } = parseBarcodeData(barcodeData)

    if (!isValid) {
      setError("Format barcode tidak valid. Pastikan barcode benar.")
      return
    }

    try {
      const warga = await getWargaByBarcode(barcodeData)
      if (warga) {
        setScannedWarga(warga)
        setSuccess(`Data warga ditemukan: ${warga.nama}`)
        onWargaFound(warga)
      } else {
        setError("Data warga tidak ditemukan untuk barcode ini.")
      }
    } catch (err) {
      setError("Gagal mencari data warga. Silakan coba lagi.")
    }
  }

  const handleConfirmWarga = () => {
    if (scannedWarga) {
      onWargaFound(scannedWarga)
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner Barcode
          </CardTitle>
          <CardDescription>Scan barcode rumah untuk mencari data warga</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div className="text-center space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Arahkan kamera ke barcode rumah</p>
              <Button onClick={handleScanBarcode} disabled={isScanning} size="lg">
                {isScanning ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                    Memindai...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Mulai Scan
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-barcode">Atau masukkan kode barcode manual</Label>
            <div className="flex gap-2">
              <Input
                id="manual-barcode"
                placeholder="Contoh: RMH001ABC1"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleManualInput} variant="outline">
                Cari
              </Button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scanned Warga Information */}
      {scannedWarga && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Data Warga Ditemukan
            </CardTitle>
            <CardDescription>Konfirmasi data warga sebelum melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {scannedWarga.nama
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{scannedWarga.nama}</h3>
                  <Badge variant={scannedWarga.statusAktif ? "default" : "secondary"} className="bg-green-500">
                    {scannedWarga.statusAktif ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{scannedWarga.nomorHp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{scannedWarga.rumah?.alamat}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">NIK: </span>
                    <span className="font-mono">{scannedWarga.nik}</span>
                  </div>
                </div>

                <Button onClick={handleConfirmWarga} className="w-full md:w-auto">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Konfirmasi & Lanjutkan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
