"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Filter, Download, Search, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getTransaksi, getTransactionSummary, createTransaksi, deleteTransaksi } from "@/lib/transactions"
import { getWarga, getJenisDana } from "@/lib/database"
import type { Transaksi, Warga, JenisDana } from "@/types/database"
import type { TransactionFilter, TransactionSummary } from "@/lib/transactions"
import { ManualTransactionForm } from "./manual-transaction-form"
import { toast } from "@/hooks/use-toast"

export function TransactionList() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [warga, setWarga] = useState<Warga[]>([])
  const [jenisDana, setJenisDana] = useState<JenisDana[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>({ status_jimpitan: "all" })
  const [searchTerm, setSearchTerm] = useState("")
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transaksiData, wargaData, jenisDanaData, summaryData] = await Promise.all([
          getTransaksi(filter),
          getWarga(),
          getJenisDana(),
          getTransactionSummary(filter),
        ])

        setTransaksi(transaksiData)
        setWarga(wargaData)
        setJenisDana(jenisDanaData)
        setSummary(summaryData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filter])

  const handleFilterChange = (newFilter: Partial<TransactionFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }))
  }

  const clearFilters = () => {
    setFilter({ status_jimpitan: "all" })
    setSearchTerm("")
  }

  const handleDeleteTransaction = async (transaksiId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.")) {
      return
    }

    try {
      const success = await deleteTransaksi(transaksiId.toString())
      if (success) {
        toast({
          title: "Berhasil",
          description: "Transaksi berhasil dihapus",
        })
        // Refresh data
        const [transaksiData, summaryData] = await Promise.all([getTransaksi(filter), getTransactionSummary(filter)])
        setTransaksi(transaksiData)
        setSummary(summaryData)
      } else {
        throw new Error("Gagal menghapus transaksi")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      })
    }
  }

  const handleManualTransactionSubmit = async (data: any) => {
    try {
      await createTransaksi(data)
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan",
      })
      // Refresh data
      const [transaksiData, summaryData] = await Promise.all([getTransaksi(filter), getTransactionSummary(filter)])
      setTransaksi(transaksiData)
      setSummary(summaryData)
      setIsManualFormOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      })
    }
  }

  const getWargaName = (transaksi: any) => {
    // Prioritas: gunakan nama dari backend JOIN, fallback ke mapping manual
    if (transaksi.namaWarga) {
      return transaksi.namaWarga
    }
    const w = warga.find((w) => w.id == transaksi.id_warga)
    return w ? w.namaLengkap : "Unknown"
  }

  const getJenisDanaName = (transaksi: any) => {
    // Prioritas: gunakan nama dari backend JOIN, fallback ke mapping manual
    if (transaksi.jenisDana) {
      return transaksi.jenisDana
    }
    const jd = jenisDana.find((jd) => jd.id == transaksi.id_jenis_dana || jd.id == transaksi.id_jenis)
    return jd ? jd.namaDana : "Unknown"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredTransaksi = transaksi.filter((t) => {
    const wargaName = getWargaName(t).toLowerCase()
    const jenisDanaName = getJenisDanaName(t).toLowerCase()
    const searchLower = searchTerm.toLowerCase()

    return wargaName.includes(searchLower) || jenisDanaName.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransaksi}</div>
              <p className="text-xs text-muted-foreground">Semua transaksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Dana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalNominal)}</div>
              <p className="text-xs text-muted-foreground">Semua dana terkumpul</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dana Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalHariIni)}</div>
              <p className="text-xs text-muted-foreground">Transaksi hari ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalBulanIni)}</div>
              <p className="text-xs text-muted-foreground">Rata-rata: {formatCurrency(summary.rataRataHarian)}/hari</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Transaksi
              </CardTitle>
              <CardDescription>Filter transaksi berdasarkan tanggal, warga, atau jenis dana</CardDescription>
            </div>
            <Button onClick={() => setIsManualFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Transaksi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label>Cari Warga/Jenis Dana</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau jenis dana..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.startDate ? format(filter.startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.startDate}
                    onSelect={(date) => handleFilterChange({ startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.endDate ? format(filter.endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.endDate}
                    onSelect={(date) => handleFilterChange({ endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" className="bg-transparent">
              Clear Filters
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Menampilkan {filteredTransaksi.length} dari {transaksi.length} transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Warga</TableHead>
                  <TableHead>Jenis Dana</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Input</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransaksi.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.tanggal_selor), "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="font-medium">{getWargaName(t)}</TableCell>
                    <TableCell>{getJenisDanaName(t)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(t.nominal)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status_jimpitan === "lunas" ? "default" : "secondary"}
                        className={t.status_jimpitan === "lunas" ? "bg-green-500" : "bg-yellow-500"}
                      >
                        {t.status_jimpitan === "lunas" ? "Lunas" : "Belum Lunas"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(t.waktu_input), "dd MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTransaksi.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ManualTransactionForm
        isOpen={isManualFormOpen}
        onClose={() => setIsManualFormOpen(false)}
        onSubmit={handleManualTransactionSubmit}
      />
    </div>
  )
}
