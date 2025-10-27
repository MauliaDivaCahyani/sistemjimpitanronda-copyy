"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { KelompokRondaInfo } from "@/components/ronda/kelompok-ronda-info"
import {
  getTodayAttendance,
  checkInAttendance,
  checkOutAttendance,
  getCurrentSession,
  getPresensi,
  markAttendance,
  type AttendanceSession,
} from "@/lib/attendance"
import { getAllPetugas } from "@/lib/database"
import type { Presensi, User, Petugas } from "@/types/database"

interface AttendanceTrackerProps {
  user: User
}

export function AttendanceTracker({ user }: AttendanceTrackerProps) {
  const [todayAttendance, setTodayAttendance] = useState<Presensi | null>(null)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [presensi, setPresensi] = useState<Presensi[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, "hadir" | "izin" | "sakit" | "alpha">>({})
  const [checkInTimes, setCheckInTimes] = useState<Record<string, Date>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendance, session, PetugasData, presensiData] = await Promise.all([
          getTodayAttendance(user.id),
          getCurrentSession(),
          getAllPetugas(),
          getPresensi({ startDate: new Date(), endDate: new Date() }),
        ])

        setTodayAttendance(attendance)
        setCurrentSession(session)
        setPetugas(PetugasData.filter((p) => p.status === "Aktif"))
        setPresensi(presensiData)

        const statusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
        const checkInMap: Record<string, Date> = {}
        presensiData.forEach((p) => {
          statusMap[p.id_user] = p.status
          if (p.check_in) {
            checkInMap[p.id_user] = new Date(p.check_in)
          }
        })
        setSelectedStatuses(statusMap)
        setCheckInTimes(checkInMap)
      } catch (err) {
        setError("Gagal memuat data absensi")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [user.id])

  // ================== FUNCTION CHECK-IN & CHECK-OUT ==================
  const handleCheckIn = async () => {
    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      const attendance = await checkInAttendance(user.id)
      setTodayAttendance(attendance)
      setSuccess("Check-in berhasil! Selamat bertugas.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan check-in")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      const attendance = await checkOutAttendance(user.id)
      setTodayAttendance(attendance)
      setSuccess("Check-out berhasil! Terima kasih atas kerja keras Anda.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan check-out")
    } finally {
      setActionLoading(false)
    }
  }

  // ================== FUNCTION ABSENSI PETUGAS ==================
  const handleCheckboxChange = (idPetugas: string, status: "hadir" | "izin" | "sakit" | "alpha", checked: boolean) => {
    setSelectedStatuses((prev) => {
      const next = { ...prev }
      next[idPetugas] = checked ? status : "hadir"
      return next
    })

    // Jika status hadir dipilih, simpan waktu saat ini
    if (checked && status === "hadir") {
      setCheckInTimes((prev) => ({
        ...prev,
        [idPetugas]: new Date(),
      }))
    }
  }

  const handleSaveAll = async () => {
    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      await Promise.all(
        petugas.map((p) => {
          const status = selectedStatuses[p.id] || "hadir"
          const checkInTime = checkInTimes[p.id]
          return markAttendance(p.id, status, user.id, checkInTime)
        }),
      )
      setSuccess("Absensi berhasil disimpan untuk semua petugas aktif")
      const newPresensi = await getPresensi({ startDate: new Date(), endDate: new Date() })
      setPresensi(newPresensi)
      setSelectedStatuses({})
      setCheckInTimes({})
    } catch (err) {
      setError("Gagal menyimpan absensi massal")
    } finally {
      setActionLoading(false)
    }
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

  const calculateWorkDuration = (checkIn: Date, checkOut?: Date | null) => {
    const endTime = checkOut || new Date()
    const duration = endTime.getTime() - checkIn.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
  }

  const formatTime = (date: Date) => format(date, "HH:mm:ss", { locale: id })
  const formatDate = (date: Date) => format(date, "EEEE, dd MMMM yyyy", { locale: id })

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

  // Filter data presensi hari ini saja
  const filteredPresensi = presensi.filter((p) => new Date(p.check_in).toDateString() === new Date().toDateString())

  return (
    <div className="space-y-6">
      {/* Current Time & Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Informasi Sesi Ronda
          </CardTitle>
          <CardDescription>Status sesi ronda dan waktu saat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Waktu Saat Ini</div>
              <div className="text-2xl font-mono font-bold">{formatTime(currentTime)}</div>
              <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status Sesi</div>
              {currentSession ? (
                <div>
                  <Badge variant="default" className="bg-green-500 mb-2">
                    Sesi Aktif
                  </Badge>
                  <div className="text-sm">
                    <div>
                      Waktu: {currentSession.startTime} - {currentSession.endTime}
                    </div>
                    <div>
                      Petugas Hadir: {currentSession.hadirCount}/{currentSession.totalPetugas}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge variant="secondary">Sesi Tidak Aktif</Badge>
                  <div className="text-sm text-muted-foreground mt-1">Sesi ronda: 19:00 - 06:00</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Attendance Form */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Tandai Absensi Petugas</CardTitle>
            <CardDescription>Tandai kehadiran semua Petugas. Jika tidak diceklis berarti hadir.</CardDescription>
          </div>
          <Button onClick={handleSaveAll} disabled={actionLoading || petugas.length === 0}>
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
                  <TableHead>Petugas</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-center w-24">Hadir</TableHead>
                  <TableHead className="text-center w-24">Izin</TableHead>
                  <TableHead className="text-center w-24">Sakit</TableHead>
                  <TableHead className="text-center w-24">Alpha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petugas.map((p) => {
                  const current = selectedStatuses[p.id] || "hadir"
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.namaLengkap}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.jabatan || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.namaKelompok || "-"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "hadir"}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "hadir", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} hadir`}
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
                            checked={current === "izin"}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "izin", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} izin`}
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
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "sakit", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} sakit`}
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
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "alpha", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} alpha`}
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
            {petugas.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada petugas aktif.</p>
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
                  <TableHead>Petugas</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petugas.map((p) => {
                  const attendance = presensi.find((pr) => pr.id_user === p.id)
                  const displayStatus = selectedStatuses[p.id] || attendance?.status || "hadir"
                  const checkInTime = checkInTimes[p.id] || attendance?.check_in
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.namaLengkap}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {checkInTime ? format(checkInTime, "HH:mm:ss", { locale: id }) : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(displayStatus)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Petunjuk Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Tandai status kehadiran petugas dengan checkbox yang tersedia</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Waktu check-in akan otomatis terisi saat Anda menandai petugas hadir</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Klik tombol "Simpan Absensi" untuk menyimpan semua data</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Jika salah input, hubungi PIC untuk pembatalan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
