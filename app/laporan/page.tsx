"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Download, FileText, Users, DollarSign, Clock, FileSpreadsheet, File } from "lucide-react"
import { getAllTransaksi, getAllWarga, getAllKelompokRonda } from "@/lib/database"

export default function LaporanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("bulanan")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedKelompok, setSelectedKelompok] = useState("semua")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // ✅ FIX: buat state penampung data async
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [warga, setWarga] = useState<any[]>([])
  const [kelompokRonda, setKelompokRonda] = useState<any[]>([])

  // ✅ FIX: ambil data dengan useEffect agar hasilnya array, bukan Promise
  useEffect(() => {
    async function fetchData() {
      try {
        const [t, w, k] = await Promise.all([
          getAllTransaksi(),
          getAllWarga(),
          getAllKelompokRonda(),
        ])
  
        setTransaksi(Array.isArray(t) ? t : [])
        setWarga(Array.isArray(w) ? w : [])
        setKelompokRonda(Array.isArray(k) ? k : [])
      } catch (err) {
        console.error("Gagal mengambil data laporan:", err)
      }
    }
    fetchData()
  }, [])
  

  // Filter data berdasarkan periode yang dipilih
  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (selectedPeriod) {
      case "harian":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "mingguan":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "bulanan":
        startDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 1)
        endDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) + 1, 0)
        break
      default:
        startDate = new Date(now.getFullYear(), 0, 1)
    }

    // ✅ Pastikan transaksi adalah array sebelum filter
    return (Array.isArray(transaksi) ? transaksi : []).filter((t) => {
      const transaksiDate = new Date(t.tanggal_selor)
      return transaksiDate >= startDate && transaksiDate <= endDate
    })
  }

  const filteredTransaksi = getFilteredData()
  const totalJimpitan = filteredTransaksi.reduce((sum, t) => sum + (t.nominal || 0), 0)
  const totalTransaksi = filteredTransaksi.length
  const wargaBayar = new Set(filteredTransaksi.map((t) => t.id_warga)).size
  const wargaBelumBayar = warga.length - wargaBayar

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Data rekap per rumah
  type RekapRumah = {
    rumahId: string
    kepalaNama: string
    alamat: string
    rt: string
    rw: string
    totalBayar: number
    jumlahTransaksi: number
    sudahBayar: boolean
  }

  const getRekapPerRumah = (): RekapRumah[] => {
    const wargaById = new Map(warga.map((w) => [w.id, w]))
    const rekapMap = new Map<string, RekapRumah>()

    warga.forEach((w) => {
      const rumahId = w.idRumah
      const alamat = w.rumah?.alamat || "Alamat tidak tersedia"
      const rt = w.rumah?.rt || "-"
      const rw = w.rumah?.rw || "-"

      if (!rekapMap.has(rumahId)) {
        rekapMap.set(rumahId, {
          rumahId,
          kepalaNama: w.isKepalaKeluarga ? w.nama : w.nama,
          alamat,
          rt,
          rw,
          totalBayar: 0,
          jumlahTransaksi: 0,
          sudahBayar: false,
        })
      }

      const current = rekapMap.get(rumahId)!
      if (w.isKepalaKeluarga) current.kepalaNama = w.nama
    })

    rekapMap.forEach((val, key) => {
      if (!val.kepalaNama) {
        const first = warga.find((w) => w.idRumah === key)
        if (first) val.kepalaNama = first.nama
      }
    })

    filteredTransaksi.forEach((t) => {
      const w = wargaById.get(t.id_warga)
      if (!w) return
      const rumahId = w.idRumah
      const entry = rekapMap.get(rumahId)
      if (!entry) return
      entry.totalBayar += t.nominal || 0
      entry.jumlahTransaksi += 1
      entry.sudahBayar = true
    })

    return Array.from(rekapMap.values())
  }

  const rekapPerRumah = getRekapPerRumah()

  const handleExportReport = (format: "pdf" | "excel" | "csv") => {
    alert(`Export laporan dalam format ${format.toUpperCase()} akan segera tersedia`)
    setIsExportDialogOpen(false)
  }

  return (
    <DashboardLayout title="Laporan & Rekapan">
      {/* Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Periode</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === "bulanan" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bulan</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tahun</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Kelompok</label>
              <Select value={selectedKelompok} onValueChange={setSelectedKelompok}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kelompok</SelectItem>
                  {kelompokRonda.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.namaKelompok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Laporan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Pilih Format Export</DialogTitle>
                  <DialogDescription>Pilih jenis file untuk mengexport laporan rekapan</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  <Button variant="outline" className="justify-start h-auto py-4 bg-transparent" onClick={() => handleExportReport("pdf")}>
                    <File className="h-5 w-5 mr-3 text-red-600" />
                    <div className="text-left">
                      <div className="font-semibold">PDF Document</div>
                      <div className="text-sm text-gray-500">Format dokumen untuk cetak dan arsip</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4 bg-transparent" onClick={() => handleExportReport("excel")}>
                    <FileSpreadsheet className="h-5 w-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold">Excel Spreadsheet</div>
                      <div className="text-sm text-gray-500">Format untuk analisis dan perhitungan</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4 bg-transparent" onClick={() => handleExportReport("csv")}>
                    <FileText className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold">CSV File</div>
                      <div className="text-sm text-gray-500">Format universal untuk import data</div>
                    </div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jimpitan</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalJimpitan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransaksi}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warga Sudah Bayar</p>
                <p className="text-2xl font-bold text-gray-900">{wargaBayar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warga Belum Bayar</p>
                <p className="text-2xl font-bold text-gray-900">{wargaBelumBayar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rekap Per Rumah */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap Per Rumah</CardTitle>
          <CardDescription>Daftar semua rumah dengan status pembayaran periode {selectedPeriod}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rekapPerRumah.map((rumah, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50"
              >
                {/* left: identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900">{rumah.kepalaNama}</h4>
                      <p className="text-sm text-gray-600">{rumah.alamat}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">RT {rumah.rt}</Badge>
                      <Badge variant="outline">RW {rumah.rw}</Badge>
                    </div>
                  </div>
                </div>

                {/* right: totals + status */}
                <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-auto">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(rumah.totalBayar)}</p>
                    <p className="text-sm text-gray-600">{rumah.jumlahTransaksi} transaksi</p>
                  </div>
                  <Badge
                    variant={rumah.sudahBayar ? "default" : "destructive"}
                    className={rumah.sudahBayar ? "bg-emerald-100 text-emerald-700" : ""}
                  >
                    {rumah.sudahBayar ? "Sudah Bayar" : "Belum Bayar"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
