"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BarcodeScanner } from "@/components/barcode/barcode-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wallet, CheckCircle } from "lucide-react"
import type { Warga, JenisDana } from "@/types/database"
import { useRouter } from "next/navigation"
import type { User } from "@/types/auth"
import { getAllJenisDana } from "@/lib/database"

const nominalTemplates = [500, 1000, 2000, 5000, 10000]

export default function ScanBarcodePage() {
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
  const [selectedJenisDana, setSelectedJenisDana] = useState<JenisDana | null>(null)
  const [selectedNominal, setSelectedNominal] = useState<number>(0)
  const [customNominal, setCustomNominal] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState("")
  const [isAllowed, setIsAllowed] = useState(false)
  const [jenisDanaList, setJenisDanaList] = useState<JenisDana[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("currentUser")
      if (!savedUser) return
      const user = JSON.parse(savedUser) as User
      if (user.role !== "petugas") {
        router.replace("/dashboard")
      } else {
        setIsAllowed(true)
      }
    } catch {
      router.replace("/dashboard")
    }
  }, [router])

  useEffect(() => {
    const fetchJenisDana = async () => {
      try {
        const data = await getAllJenisDana()
        setJenisDanaList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching jenis dana:", error)
      }
    }
  
    fetchJenisDana()
  }, [])
  

  const handleSelectJenisDana = (jenis: JenisDana) => {
    setSelectedJenisDana(jenis)
    setShowScanner(true)
    setSelectedWarga(null)
    setSelectedNominal(jenis.nominalDefault)
    setCustomNominal("")
  }

  const handleWargaFound = (warga: Warga) => {
    setSelectedWarga(warga)
    setSelectedNominal(selectedJenisDana?.nominalDefault || 1000)
  }

  const handleNominalSelect = (nominal: number) => {
    setSelectedNominal(nominal)
    setCustomNominal("")
  }

  const handleCustomNominalChange = (value: string) => {
    setCustomNominal(value)
    const numValue = Number.parseInt(value.replace(/\D/g, ""))
    if (!isNaN(numValue)) {
      setSelectedNominal(numValue)
    }
  }

  const handleSubmitTransaction = async () => {
    if (!selectedWarga || selectedNominal <= 0 || !selectedJenisDana) return

    setIsProcessing(true)
    try {
      // Simulate API call to save transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess(
        `Transaksi ${selectedJenisDana.namaDana} berhasil disimpan! Dana Rp ${selectedNominal.toLocaleString("id-ID")} dari ${selectedWarga.nama}`,
      )

      // Reset form after success
      setTimeout(() => {
        setSelectedWarga(null)
        setSelectedNominal(0)
        setCustomNominal("")
        setSuccess("")
        setShowScanner(false)
        setSelectedJenisDana(null)
      }, 3000)
    } catch (error) {
      console.error("Error saving transaction:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToJenisDana = () => {
    setSelectedWarga(null)
    setSelectedNominal(0)
    setCustomNominal("")
    setSuccess("")
    setShowScanner(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout title="Scan Barcode">
      {!isAllowed ? null : (
        <div className="space-y-6">
          {!showScanner ? (
            <Card>
              <CardHeader>
                <CardTitle>Pilih Jenis Transaksi</CardTitle>
                <CardDescription>Pilih jenis dana yang akan diinput terlebih dahulu</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {jenisDanaList.map((jenis) => (
                      <div
                        key={jenis.id}
                        onClick={() => handleSelectJenisDana(jenis)}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-5 hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{jenis.namaDana}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{jenis.deskripsi}</p>
                        <Badge className="bg-emerald-500/15 text-emerald-700 font-semibold">
                          {formatCurrency(jenis.nominalDefault || 0)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
            </Card>
          ) : (
            <>
              {!selectedWarga ? (
                <BarcodeScanner onWargaFound={handleWargaFound} />
              ) : (
                <>
                  <Button variant="outline" onClick={handleBackToJenisDana} className="mb-4 bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Pilihan Jenis Dana
                  </Button>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Input Nominal Dana
                      </CardTitle>
                      <CardDescription>Masukkan nominal dana yang disetor oleh {selectedWarga.nama}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                          {selectedWarga.nama
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedWarga.nama}</h3>
                          <p className="text-sm text-muted-foreground">{selectedWarga.rumah?.alamat}</p>
                        </div>
                        <Badge variant="default" className="bg-green-500 ml-auto">
                          Aktif
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <Label>Pilih Nominal (Template)</Label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {nominalTemplates.map((nominal) => (
                            <Button
                              key={nominal}
                              variant={selectedNominal === nominal ? "default" : "outline"}
                              onClick={() => handleNominalSelect(nominal)}
                              className="h-12"
                            >
                              {formatCurrency(nominal)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-nominal">Atau masukkan nominal custom</Label>
                        <Input
                          id="custom-nominal"
                          type="text"
                          placeholder="Masukkan nominal..."
                          value={customNominal}
                          onChange={(e) => handleCustomNominalChange(e.target.value)}
                        />
                      </div>

                      {selectedNominal > 0 && (
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Nominal yang akan diinput:</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(selectedNominal)}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmitTransaction}
                        disabled={selectedNominal <= 0 || isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                            Menyimpan Transaksi...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Simpan Transaksi
                          </>
                        )}
                      </Button>

                      {success && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">{success}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
