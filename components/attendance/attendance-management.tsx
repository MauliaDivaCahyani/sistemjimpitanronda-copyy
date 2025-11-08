"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  getPresensi,
  getAttendanceSummary,
  type AttendanceFilter,
  type AttendanceSummary,
} from "@/lib/attendance"
import { getAllWarga, getAllPetugas } from "@/lib/database"
import type { Presensi, Warga, User, Petugas } from "@/types/database"

interface AttendanceManagementProps {
  currentUser: User
}

export function AttendanceManagement({ currentUser }: AttendanceManagementProps) {
  const [presensi, setPresensi] = useState<Presensi[]>([])
  const [warga, setWarga] = useState<Warga[]>([])
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<AttendanceFilter>({
    startDate: new Date(),
    endDate: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presensiData, wargaData, petugasData, summaryData] = await Promise.all([
          getPresensi(filter),
          getAllWarga(),
          getAllPetugas(),
          getAttendanceSummary(filter),
        ])

        console.log('AttendanceManagement - Loaded presensi:', presensiData.map(p => ({ 
          id: p.id, 
          id_warga: p.id_warga, 
          status: p.status,
          tanggal: p.tanggal 
        })))

        setPresensi(presensiData)
        setWarga(wargaData.filter((w) => w.statusAktif))
        setPetugas(petugasData.filter((p) => p.status === "Aktif"))
        setSummary(summaryData)
      } catch {
        setError("Gagal memuat data absensi")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filter])

  const handleFilterChange = (newFilter: Partial<AttendanceFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }))
  }

  const getWargaName = (idWarga: string) => {
    const w = warga.find((w) => w.id === idWarga)
    if (w) return w.namaLengkap
    
    // Coba cari di data petugas
    const p = petugas.find((p) => p.id_warga === idWarga)
    if (p) return p.namaLengkap
    
    return "Unknown"
  }

  const filteredPresensi = presensi.filter((p) => {
    if (!p.id_warga) return false
    const wargaName = getWargaName(p.id_warga).toLowerCase()
    return wargaName.includes(searchTerm.toLowerCase())
  })

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-primary text-white", label: "Hadir" },
      izin: { variant: "secondary" as const, className: "bg-blue-500 text-white", label: "Izin" },
      sakit: { variant: "secondary" as const, className: "bg-yellow-500 text-white", label: "Sakit" },
      alpha: { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Alpha" },
      "tidak hadir": { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Tidak Hadir" },
    }
    
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.hadir
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading data absensi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Hadir</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHadir}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Izin</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalIzin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sakit</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSakit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alpha</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAlpha}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Persentase</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.persentaseKehadiran.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Absensi
          </CardTitle>
          <CardDescription>Gunakan filter untuk menampilkan data kehadiran petugas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari Petugas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama petugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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
        </CardContent>
      </Card>
    </div>
  )
}
