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

interface LaporanSummary {
  totalJimpitan: number
  totalTransaksi: number
  wargaSudahBayar: number
  wargaBelumBayar: number
  totalWarga: number
}

interface RekapRumah {
  idRumah: number
  alamat: string
  kepalaKeluarga: string
  nik: string
  rt: string
  rw: string
  totalBayar: number
  jumlahTransaksi: number
  sudahBayar: boolean
}

interface DetailTransaksi {
  idTransaksi: number
  tanggalSetor: string
  namaWarga: string
  jenisDana: string
  nominal: number
  status: string
  waktuInput: string
}

export default function LaporanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("bulanan")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedKelompok, setSelectedKelompok] = useState("semua")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [summary, setSummary] = useState<LaporanSummary>({
    totalJimpitan: 0,
    totalTransaksi: 0,
    wargaSudahBayar: 0,
    wargaBelumBayar: 0,
    totalWarga: 0
  })
  const [rekapPerRumah, setRekapPerRumah] = useState<RekapRumah[]>([])
  const [detailTransaksi, setDetailTransaksi] = useState<DetailTransaksi[]>([])

  // Fetch laporan dari backend
  const fetchLaporan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        periode: selectedPeriod,
        bulan: selectedMonth,
        tahun: selectedYear,
      })
      
      console.log('[LAPORAN] Fetching with params:', Object.fromEntries(params))
      
      const response = await fetch(`http://localhost:5006/api/laporan/generate?${params}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('[LAPORAN] Data received:', data.data)
        setSummary(data.data.summary)
        setRekapPerRumah(data.data.rekapPerRumah)
        setDetailTransaksi(data.data.detailTransaksi || [])
      } else {
        console.error('[LAPORAN] Error:', data.error)
      }
    } catch (error) {
      console.error('[LAPORAN] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data saat filter berubah
  useEffect(() => {
    fetchLaporan()
  }, [selectedPeriod, selectedMonth, selectedYear])

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

  const handleExportReport = async (format: "pdf" | "excel") => {
    try {
      setLoading(true)
      
      if (format === "excel") {
        // Export ke Excel menggunakan library xlsx dengan styling maksimal
        const XLSX = await import('xlsx')
        
        // Prepare header and summary
        const data: any[][] = []
        
        // Title section
        data.push(['LAPORAN & REKAPAN JIMPITAN RONDA'])
        data.push([])
        data.push(['Periode:', selectedPeriod.toUpperCase()])
        data.push(['Bulan:', months[parseInt(selectedMonth)]])
        data.push(['Tahun:', selectedYear])
        data.push([])
        
        // Summary section
        data.push(['RINGKASAN'])
        data.push(['Total Jimpitan:', formatCurrency(summary.totalJimpitan)])
        data.push(['Total Transaksi:', summary.totalTransaksi])
        data.push(['Rumah Sudah Bayar:', summary.wargaSudahBayar])
        data.push(['Rumah Belum Bayar:', summary.wargaBelumBayar])
        data.push([])
        data.push([])
        
        // Table section
        data.push(['REKAP PER RUMAH'])
        data.push(['No', 'ID', 'Kepala Keluarga', 'Alamat', 'RT/RW', 'Total Bayar', 'Transaksi', 'Status'])
        
        // Table data
        rekapPerRumah.forEach((rumah, index) => {
          data.push([
            index + 1,
            rumah.idRumah,
            rumah.kepalaKeluarga,
            rumah.alamat,
            `${rumah.rt}/${rumah.rw}`,
            formatCurrency(rumah.totalBayar),
            rumah.jumlahTransaksi,
            rumah.sudahBayar ? 'Sudah Bayar' : 'Belum Bayar'
          ])
        })
        
        // Add detail transaksi section
        data.push([])
        data.push([])
        data.push(['DETAIL TRANSAKSI'])
        data.push(['No', 'Tanggal', 'Warga', 'Jenis Dana', 'Nominal', 'Status', 'Waktu Input'])
        
        // Detail transaksi data
        detailTransaksi.forEach((transaksi, index) => {
          const tanggal = new Date(transaksi.tanggalSetor).toLocaleDateString('id-ID')
          const waktu = new Date(transaksi.waktuInput).toLocaleString('id-ID')
          data.push([
            index + 1,
            tanggal,
            transaksi.namaWarga,
            transaksi.jenisDana,
            formatCurrency(transaksi.nominal),
            transaksi.status,
            waktu
          ])
        })
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data)
        
        // Set column widths for better readability
        ws['!cols'] = [
          { wch: 6 },   // No
          { wch: 8 },   // ID
          { wch: 25 },  // Kepala Keluarga
          { wch: 35 },  // Alamat
          { wch: 10 },  // RT/RW
          { wch: 18 },  // Total Bayar
          { wch: 12 },  // Transaksi
          { wch: 15 }   // Status
        ]
        
        // Apply cell styles
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        
        // Style title (row 0)
        if (ws['A1']) {
          ws['A1'].s = {
            font: { name: 'Calibri', sz: 16, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        
        // Merge title across columns
        if (!ws['!merges']) ws['!merges'] = []
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })
        
        // Style section headers (RINGKASAN at row 6, REKAP PER RUMAH at row 13)
        const sectionHeaders = [6, 13]
        sectionHeaders.forEach(row => {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 })
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { name: 'Calibri', sz: 12, bold: true },
              fill: { fgColor: { rgb: 'DBEAFE' } },
              alignment: { horizontal: 'left', vertical: 'center' }
            }
            // Merge section headers
            ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 7 } })
          }
        })
        
        // Style table header (row 14)
        for (let col = 0; col <= 7; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: 14, c: col })
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '3B82F6' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: '000000' } },
                bottom: { style: 'medium', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            }
          }
        }
        
        // Style table data rows (starting from row 15)
        const tableStartRow = 15
        const tableEndRow = 14 + rekapPerRumah.length
        
        for (let row = tableStartRow; row <= tableEndRow; row++) {
          const isEvenRow = (row - tableStartRow) % 2 === 0
          
          for (let col = 0; col <= 7; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
            if (ws[cellRef]) {
              ws[cellRef].s = {
                font: { name: 'Calibri', sz: 10 },
                fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'F9FAFB' } },
                alignment: { 
                  horizontal: (col === 0 || col === 1 || col === 6) ? 'center' : 'left',
                  vertical: 'center' 
                },
                border: {
                  top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  right: { style: 'thin', color: { rgb: 'D1D5DB' } }
                }
              }
              
              // Special styling for Status column
              if (col === 7 && ws[cellRef].v) {
                const isSudahBayar = ws[cellRef].v === 'Sudah Bayar'
                ws[cellRef].s.font = {
                  name: 'Calibri',
                  sz: 10,
                  bold: true,
                  color: { rgb: isSudahBayar ? '059669' : 'DC2626' }
                }
                ws[cellRef].s.fill = { 
                  fgColor: { rgb: isSudahBayar ? 'D1FAE5' : 'FEE2E2' } 
                }
              }
            }
          }
        }
        
        // Style summary section labels (rows 7-11)
        for (let row = 7; row <= 11; row++) {
          const labelCell = XLSX.utils.encode_cell({ r: row, c: 0 })
          if (ws[labelCell]) {
            ws[labelCell].s = {
              font: { name: 'Calibri', sz: 10, bold: true },
              alignment: { horizontal: 'left', vertical: 'center' }
            }
          }
        }
        
        // Style DETAIL TRANSAKSI section
        const detailTransaksiRow = 15 + rekapPerRumah.length + 2 // after rekap table + 2 empty rows
        const cellRef = XLSX.utils.encode_cell({ r: detailTransaksiRow, c: 0 })
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { name: 'Calibri', sz: 12, bold: true },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'left', vertical: 'center' }
          }
          ws['!merges'].push({ s: { r: detailTransaksiRow, c: 0 }, e: { r: detailTransaksiRow, c: 6 } })
        }
        
        // Style detail transaksi table header
        const detailHeaderRow = detailTransaksiRow + 1
        for (let col = 0; col <= 6; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: detailHeaderRow, c: col })
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '3B82F6' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: '000000' } },
                bottom: { style: 'medium', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            }
          }
        }
        
        // Style detail transaksi data rows
        const detailDataStartRow = detailHeaderRow + 1
        const detailDataEndRow = detailDataStartRow + detailTransaksi.length - 1
        
        for (let row = detailDataStartRow; row <= detailDataEndRow; row++) {
          const isEvenRow = (row - detailDataStartRow) % 2 === 0
          
          for (let col = 0; col <= 6; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
            if (ws[cellRef]) {
              ws[cellRef].s = {
                font: { name: 'Calibri', sz: 10 },
                fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'F9FAFB' } },
                alignment: { 
                  horizontal: (col === 0 || col === 4) ? 'center' : 'left',
                  vertical: 'center' 
                },
                border: {
                  top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  right: { style: 'thin', color: { rgb: 'D1D5DB' } }
                }
              }
            }
          }
        }
        
        // Update column widths to accommodate detail transaksi
        ws['!cols'] = [
          { wch: 6 },   // No
          { wch: 15 },  // Tanggal / ID
          { wch: 25 },  // Warga / Kepala Keluarga
          { wch: 20 },  // Jenis Dana / Alamat
          { wch: 18 },  // Nominal / RT/RW
          { wch: 12 },  // Status / Total Bayar
          { wch: 20 }   // Waktu Input / Transaksi
        ]
        
        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
        
        // Generate filename
        const filename = `Laporan_Jimpitan_${selectedPeriod}_${months[parseInt(selectedMonth)]}_${selectedYear}.xlsx`
        
        // Save file
        XLSX.writeFile(wb, filename)
        
      } else if (format === "pdf") {
        // Export ke PDF menggunakan jsPDF
        const jsPDF = (await import('jspdf')).default
        const autoTable = (await import('jspdf-autotable')).default
        
        const doc = new jsPDF()
        
        // Add title (centered)
        doc.setFontSize(16)
        const title = 'LAPORAN & REKAPAN JIMPITAN RONDA'
        const pageWidth = doc.internal.pageSize.width
        const textWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor
        const textX = (pageWidth - textWidth) / 2
        doc.text(title, textX, 15)
        
        // Add period info
        doc.setFontSize(10)
        doc.text(`Periode: ${selectedPeriod.toUpperCase()}`, 14, 25)
        doc.text(`Bulan: ${months[parseInt(selectedMonth)]}`, 14, 30)
        doc.text(`Tahun: ${selectedYear}`, 14, 35)
        
        // Add summary
        doc.setFontSize(12)
        doc.text('RINGKASAN', 14, 45)
        doc.setFontSize(10)
        doc.text(`Total Jimpitan: ${formatCurrency(summary.totalJimpitan)}`, 14, 52)
        doc.text(`Total Transaksi: ${summary.totalTransaksi}`, 14, 57)
        doc.text(`Rumah Sudah Bayar: ${summary.wargaSudahBayar}`, 14, 62)
        doc.text(`Rumah Belum Bayar: ${summary.wargaBelumBayar}`, 14, 67)
        
        // Add table
        doc.setFontSize(12)
        doc.text('REKAP PER RUMAH', 14, 77)
        
        const tableData = rekapPerRumah.map((rumah, index) => [
          index + 1,
          rumah.idRumah,
          rumah.kepalaKeluarga,
          rumah.alamat,
          `${rumah.rt}/${rumah.rw}`,
          formatCurrency(rumah.totalBayar),
          rumah.jumlahTransaksi,
          rumah.sudahBayar ? 'Sudah Bayar' : 'Belum Bayar'
        ])
        
        autoTable(doc, {
          startY: 82,
          head: [['No', 'ID', 'Kepala Keluarga', 'Alamat', 'RT/RW', 'Total Bayar', 'Transaksi', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 }
        })
        
        // Get final Y position after rekap table
        const finalY = (doc as any).lastAutoTable.finalY || 82
        
        // Add detail transaksi section
        doc.setFontSize(12)
        doc.text('DETAIL TRANSAKSI', 14, finalY + 10)
        
        const detailTableData = detailTransaksi.map((transaksi, index) => {
          const tanggal = new Date(transaksi.tanggalSetor).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
          const waktu = new Date(transaksi.waktuInput).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
          return [
            index + 1,
            tanggal,
            transaksi.namaWarga,
            transaksi.jenisDana,
            formatCurrency(transaksi.nominal),
            transaksi.status,
            waktu
          ]
        })
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['No', 'Tanggal', 'Warga', 'Jenis Dana', 'Nominal', 'Status', 'Waktu']],
          body: detailTableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 35 },
            3: { cellWidth: 30 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 20 },
            6: { halign: 'center', cellWidth: 20 }
          }
        })
        
        // Generate filename
        const filename = `Laporan_Jimpitan_${selectedPeriod}_${months[parseInt(selectedMonth)]}_${selectedYear}.pdf`
        
        // Save file
        doc.save(filename)
      }
      
      setIsExportDialogOpen(false)
    } catch (error) {
      console.error('[EXPORT] Error:', error)
      alert('Gagal mengexport laporan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
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
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 bg-transparent"
                    onClick={() => handleExportReport("pdf")}
                  >
                    <File className="h-5 w-5 mr-3 text-red-600" />
                    <div className="text-left">
                      <div className="font-semibold">PDF Document</div>
                      <div className="text-sm text-muted-foreground">Format dokumen untuk cetak dan arsip</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 bg-transparent"
                    onClick={() => handleExportReport("excel")}
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">Excel Spreadsheet</div>
                      <div className="text-sm text-muted-foreground">Format untuk analisis dan perhitungan</div>
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
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">Rp</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Jimpitan</p>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(summary.totalJimpitan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold text-card-foreground">{summary.totalTransaksi}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rumah Sudah Bayar</p>
                <p className="text-2xl font-bold text-card-foreground">{summary.wargaSudahBayar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rumah Belum Bayar</p>
                <p className="text-2xl font-bold text-card-foreground">{summary.wargaBelumBayar}</p>
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
                key={rumah.idRumah || index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50"
              >
                {/* left: identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-card-foreground">{rumah.kepalaKeluarga}</h4>
                      <p className="text-sm text-muted-foreground">ID: {rumah.idRumah} - {rumah.alamat}</p>
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
                    <p className="font-semibold text-card-foreground">{formatCurrency(rumah.totalBayar)}</p>
                    <p className="text-sm text-muted-foreground">{rumah.jumlahTransaksi} transaksi</p>
                  </div>
                  <Badge
                    variant={rumah.sudahBayar ? "default" : "destructive"}
                    className={rumah.sudahBayar ? "bg-primary/10 text-primary" : ""}
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
