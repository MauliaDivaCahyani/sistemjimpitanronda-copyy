"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Users, UserCheck, UserX, Clock, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  getPresensi,
  getAttendanceSummary,
  markAttendance,
  type AttendanceFilter,
  type AttendanceSummary,
} from "@/lib/attendance"
import { getAllWarga } from "@/lib/database"
import type { Presensi, Warga, User } from "@/types/database"

interface AttendanceManagementProps {
  currentUser: User
}

export function AttendanceManagement({ currentUser }: AttendanceManagementProps) {
  const [presensi, setPresensi] = useState<Presensi[]>([])
  const [warga, setWarga] = useState<Warga[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [filter, setFilter] = useState<AttendanceFilter>({
    startDate: new Date(),
    endDate: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, "hadir" | "izin" | "sakit" | "alpha">>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presensiData, wargaData, summaryData] = await Promise.all([
          getPresensi(filter),
          getAllWarga(),
          getAttendanceSummary(filter),
        ])

        setPresensi(presensiData)
        setWarga(wargaData.filter((w) => w.statusAktif)) // Only active residents
        setSummary(summaryData)

        // Initialize default statuses to 'hadir' and prefill from today's presensi if available
        setSelectedStatuses((prev) => {
          const next = { ...prev }
          const wargaAktif = wargaData.filter((w) => w.statusAktif)
          for (const w of wargaAktif) {
            if (!next[w.id]) next[w.id] = "hadir"
          }
          // Prefill from current presensi (if present)
          for (const p of presensiData) {
            next[p.id_user] = p.status
          }
          return next
        })
      } catch (err) {
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

  const handleCheckboxChange = (idWarga: string, status: "izin" | "sakit" | "alpha", checked: boolean) => {
    setSelectedStatuses((prev) => {
      const next = { ...prev }
      if (checked) {
        // make it mutually exclusive by setting the selected status
        next[idWarga] = status
      } else {
        // when unchecked, default back to 'hadir'
        next[idWarga] = "hadir"
      }
      return next
    })
  }

  const handleSaveAll = async () => {
    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      // Save attendance for all active warga; default is 'hadir' when no checkbox is selected
      await Promise.all(
        warga.map((w) => {
          const status = selectedStatuses[w.id] || "hadir"
          return markAttendance(w.id, status, currentUser.id)
        }),
      )

      setSuccess("Absensi berhasil disimpan untuk semua warga aktif")

      // Refresh data after save
      const [presensiData, summaryData] = await Promise.all([getPresensi(filter), getAttendanceSummary(filter)])
      setPresensi(presensiData)
      setSummary(summaryData)
    } catch (err) {
      setError("Gagal menyimpan absensi massal")
    } finally {
      setActionLoading(false)
    }
  }

  const getWargaName = (idWarga: string) => {
    const w = warga.find((w) => w.id === idWarga)
    return w ? w.nama : "Unknown"
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-green-500", label: "Hadir" },
      izin: { variant: "secondary" as const, className: "bg-blue-500", label: "Izin" },
      sakit: { variant: "secondary" as const, className: "bg-yellow-500", label: "Sakit" },
      alpha: { variant: "destructive" as const, className: "bg-red-500", label: "Alpha" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.alpha
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const filteredPresensi = presensi.filter((p) => {
    const wargaName = getWargaName(p.id_user).toLowerCase()
    return wargaName.includes(searchTerm.toLowerCase())
  })

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hadir</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHadir}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Izin</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalIzin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sakit</CardTitle>
              <UserX className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSakit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alpha</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAlpha}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persentase</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.persentaseKehadiran.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Attendance Form */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Tandai Absensi Warga</CardTitle>
            <CardDescription>
              Tandai kehadiran semua warga (cek salah satu: izin, sakit, alpha). Jika tidak diceklis berarti hadir.
            </CardDescription>
          </div>
          <Button onClick={handleSaveAll} disabled={actionLoading || warga.length === 0}>
            {actionLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                Menyimpan...
              </>
            ) : (
              "Simpan Absensi"
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warga</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-center w-24">Izin</TableHead>
                  <TableHead className="text-center w-24">Sakit</TableHead>
                  <TableHead className="text-center w-24">Alpha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warga.map((w) => {
                  const current = selectedStatuses[w.id] || "hadir"
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.nama}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{w.rumah?.alamat}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "izin"}
                            onCheckedChange={(c) => handleCheckboxChange(w.id, "izin", Boolean(c))}
                            aria-label={`Tandai ${w.nama} izin`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "sakit"}
                            onCheckedChange={(c) => handleCheckboxChange(w.id, "sakit", Boolean(c))}
                            aria-label={`Tandai ${w.nama} sakit`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "alpha"}
                            onCheckedChange={(c) => handleCheckboxChange(w.id, "alpha", Boolean(c))}
                            aria-label={`Tandai ${w.nama} alpha`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {warga.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada warga aktif.</p>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50 mt-4">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Absensi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari Warga</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama warga..."
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

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Absensi</CardTitle>
          <CardDescription>
            Menampilkan {filteredPresensi.length} dari {presensi.length} record absensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warga</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Durasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warga.map((w) => {
                  const attendance = presensi.find((p) => p.id_user === w.id)
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.nama}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {attendance?.check_in ? format(attendance.check_in, "HH:mm:ss", { locale: id }) : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {attendance?.check_out ? format(attendance.check_out, "HH:mm:ss", { locale: id }) : "-"}
                      </TableCell>$
                      <TableCell>{getStatusBadge(attendance?.status || "hadir")}</TableCell>
                      <TableCell className="text-sm">
                        {attendance?.check_out
                          ? `${Math.floor((attendance.check_out.getTime() - attendance.check_in.getTime()) / (1000 * 60 * 60))} jam`
                          : "Sedang bertugas"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {filteredPresensi.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada data absensi yang ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
