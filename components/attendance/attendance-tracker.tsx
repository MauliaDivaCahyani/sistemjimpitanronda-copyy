"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, UserCheck, Calendar } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
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
import { getTodayDayName, isScheduledToday, formatScheduleDisplay } from "@/lib/schedule-utils"
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
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const [attendance, session, PetugasData, presensiData] = await Promise.all([
          getTodayAttendance(user.id),
          getCurrentSession(),
          getAllPetugas(),
          getPresensi({ startDate: today, endDate: tomorrow }),
        ])

        setTodayAttendance(attendance)
        setCurrentSession(session)
        
        // Filter petugas berdasarkan status aktif dan jadwal hari ini
        const activePetugas = PetugasData.filter((p) => p.status === "Aktif")
        const todayScheduledPetugas = activePetugas.filter((p) => {
          // Cast p ke any untuk akses jadwalHari
          const jadwalHari = (p as any).jadwalHari
          return isScheduledToday(jadwalHari)
        })
        
        setPetugas(todayScheduledPetugas)
        setPresensi(presensiData)
        
        // Debug logging
        console.log('Today is:', getTodayDayName())
        console.log('All active petugas:', activePetugas.map(p => ({ 
          id: p.id, 
          nama: p.namaLengkap, 
          jadwal: (p as any).jadwalHari,
          scheduledToday: isScheduledToday((p as any).jadwalHari)
        })))
        console.log('Today scheduled petugas:', todayScheduledPetugas.map(p => ({ 
          id: p.id, 
          nama: p.namaLengkap, 
          jadwal: (p as any).jadwalHari 
        })))
        console.log('Loaded presensi:', presensiData.map(p => ({ id: p.id, id_warga: p.id_warga, status: p.status, tanggal: p.tanggal })))

        const statusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
        const checkInMap: Record<string, Date> = {}
        
        // Map status berdasarkan id_warga dari petugas yang terjadwal hari ini
        todayScheduledPetugas.forEach((petugas) => {
          const attendance = presensiData.find((pr) => pr.id_warga === petugas.id_warga)
          if (attendance) {
            // Konversi status dari backend ke frontend format
            let frontendStatus: "hadir" | "izin" | "sakit" | "alpha" = "alpha"
            switch (attendance.status as string) {
              case "Hadir":
                frontendStatus = "hadir"
                break
              case "Izin":
                frontendStatus = "izin"
                break
              case "Sakit":
                frontendStatus = "sakit"
                break
              case "Tidak Hadir":
                frontendStatus = "alpha"
                break
              default:
                frontendStatus = "alpha"
            }
            
            statusMap[petugas.id] = frontendStatus
            if (attendance.check_in) {
              checkInMap[petugas.id] = new Date(attendance.check_in)
            }
          } else {
            // Jika belum ada data presensi, set default ke "hadir" dengan waktu saat ini
            // Tapi jangan simpan ke database dulu, hanya untuk tampilan
            statusMap[petugas.id] = "hadir"
            checkInMap[petugas.id] = new Date()
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
      if (checked) {
        next[idPetugas] = status
      } else {
        // Jika di-uncheck, kembali ke default "hadir"
        next[idPetugas] = "hadir"
      }
      return next
    })

    // Jika status hadir dipilih atau di-uncheck (kembali ke hadir), simpan waktu saat ini
    if ((checked && status === "hadir") || (!checked)) {
      setCheckInTimes((prev) => ({
        ...prev,
        [idPetugas]: new Date(),
      }))
    } else if (checked && status !== "hadir") {
      // Jika pilih status selain hadir, hapus check-in time
      setCheckInTimes((prev) => {
        const next = { ...prev }
        delete next[idPetugas]
        return next
      })
    }
  }

  const handleSaveAll = async () => {
    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      // Filter petugas yang memiliki id_warga valid
      const validPetugas = petugas.filter(p => p.id_warga)
      
      if (validPetugas.length === 0) {
        setError("Tidak ada petugas dengan data warga yang valid untuk diabsen")
        return
      }
      
      await Promise.all(
        validPetugas.map((p) => {
          const status = selectedStatuses[p.id] || "hadir"
          const checkInTime = checkInTimes[p.id]
          console.log(`Saving attendance for ${p.namaLengkap}: status=${status}, id_warga=${p.id_warga}`)
          // Gunakan id_warga dari petugas untuk presensi
          return markAttendance(p.id_warga!, status, user.id, checkInTime)
        }),
      )
      setSuccess(`Absensi berhasil disimpan untuk ${validPetugas.length} petugas aktif`)
      
      // Tunggu sebentar untuk memastikan data tersimpan di database
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refresh data presensi dengan range yang lebih luas untuk memastikan data terbaru muncul
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const newPresensi = await getPresensi({ startDate: today, endDate: tomorrow })
      setPresensi(newPresensi)
      
      console.log('Refreshed presensi data:', newPresensi.map(p => ({ id_warga: p.id_warga, status: p.status })))
      
      // Update selectedStatuses dengan data yang baru disimpan agar tampil di tabel
      const newStatusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
      const newCheckInMap: Record<string, Date> = {}
      
      validPetugas.forEach((petugas) => {
        const savedStatus = selectedStatuses[petugas.id] || "hadir"
        const savedCheckIn = checkInTimes[petugas.id] || new Date()
        
        newStatusMap[petugas.id] = savedStatus
        newCheckInMap[petugas.id] = savedCheckIn
      })
      
      setSelectedStatuses(newStatusMap)
      setCheckInTimes(newCheckInMap)
      
    } catch (err) {
      setError("Gagal menyimpan absensi massal")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    // Normalize status untuk menangani variasi dari backend
    const normalizedStatus = status.toLowerCase()
    
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-green-500", label: "Hadir" },
      izin: { variant: "secondary" as const, className: "bg-blue-500", label: "Izin" },
      sakit: { variant: "secondary" as const, className: "bg-yellow-500", label: "Sakit" },
      alpha: { variant: "destructive" as const, className: "bg-red-500", label: "Alpha" },
      "tidak hadir": { variant: "destructive" as const, className: "bg-red-500", label: "Tidak Hadir" },
    }
    
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.hadir
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

  // Filter data presensi hari ini saja berdasarkan tanggal
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
  const filteredPresensi = presensi.filter((p) => {
    if (!p.tanggal) return false
    const presensiDate = new Date(p.tanggal).toISOString().split('T')[0]
    return presensiDate === todayStr
  })

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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Waktu Saat Ini</div>
              <div className="text-2xl font-mono font-bold">{formatTime(currentTime)}</div>
              <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Hari Ronda</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Badge variant="default" className="bg-blue-500">
                  {getTodayDayName()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {petugas.length > 0 ? `${petugas.length} petugas bertugas` : 'Tidak ada petugas bertugas'}
              </div>
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
            <CardTitle>Tandai Absensi Petugas Ronda Hari Ini</CardTitle>
            <CardDescription>
              Absensi petugas yang bertugas pada hari {getTodayDayName()}. Jika tidak diceklis berarti hadir.
              {petugas.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs">
                    {petugas.filter(p => p.id_warga).length} dari {petugas.length} petugas dapat diabsen
                    {petugas.filter(p => !p.id_warga).length > 0 && (
                      <span className="text-yellow-600"> • {petugas.filter(p => !p.id_warga).length} petugas memiliki data tidak lengkap</span>
                    )}
                  </span>
                </div>
              )}
              {petugas.length === 0 && (
                <div className="mt-1">
                  <span className="text-orange-600 text-xs">
                    Tidak ada petugas yang terjadwal ronda pada hari {getTodayDayName()}
                  </span>
                </div>
              )}
            </CardDescription>
          </div>
          <Button onClick={handleSaveAll} disabled={actionLoading || petugas.filter(p => p.id_warga).length === 0}>
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
                  <TableHead>Kelompok & Jadwal</TableHead>
                  <TableHead className="text-center w-24">Hadir</TableHead>
                  <TableHead className="text-center w-24">Izin</TableHead>
                  <TableHead className="text-center w-24">Sakit</TableHead>
                  <TableHead className="text-center w-24">Alpha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petugas.map((p) => {
                  const current = selectedStatuses[p.id] || "hadir"
                  const hasValidWarga = !!p.id_warga
                  return (
                    <TableRow key={p.id} className={!hasValidWarga ? "opacity-50 bg-muted/30" : ""}>
                      <TableCell className="font-medium">
                        {p.namaLengkap}
                        {!hasValidWarga && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Data Tidak Lengkap
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.jabatan || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          <div>{p.namaKelompok || "-"}</div>
                          <div className="text-xs text-blue-600">
                            {formatScheduleDisplay((p as any).jadwalHari)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "hadir"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "hadir", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} hadir`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "izin"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "izin", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} izin`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "sakit"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "sakit", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} sakit`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "alpha"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "alpha", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} alpha`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Tidak ada petugas yang terjadwal ronda hari ini</p>
                <p className="text-sm text-muted-foreground mt-1">Hari {getTodayDayName()} tidak ada jadwal ronda</p>
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
          <CardTitle>Daftar Absensi Petugas Ronda</CardTitle>
          <CardDescription>
            Menampilkan {petugas.length} petugas yang terjadwal ronda pada hari {getTodayDayName()}
            {filteredPresensi.length > 0 && (
              <span className="text-xs block mt-1">
                {filteredPresensi.length} record absensi tersimpan hari ini
              </span>
            )}
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
                  // Cari data presensi berdasarkan id_warga dari database
                  const savedAttendance = presensi.find((pr) => pr.id_warga === p.id_warga)
                  
                  // Prioritaskan status yang dipilih user (belum disimpan), 
                  // kemudian status dari database (sudah disimpan), 
                  // default ke "hadir"
                  let displayStatus: "hadir" | "izin" | "sakit" | "alpha" = "hadir"
                  
                  if (selectedStatuses[p.id]) {
                    // Ada status yang dipilih user (belum/baru disimpan)
                    displayStatus = selectedStatuses[p.id]
                  } else if (savedAttendance) {
                    // Ada data dari database
                    switch (savedAttendance.status as string) {
                      case "Hadir":
                        displayStatus = "hadir"
                        break
                      case "Izin":
                        displayStatus = "izin"
                        break
                      case "Sakit":
                        displayStatus = "sakit"
                        break
                      case "Tidak Hadir":
                        displayStatus = "alpha"
                        break
                      default:
                        displayStatus = "hadir"
                    }
                  }
                  
                  // Untuk check-in time, prioritaskan yang baru dipilih, kemudian dari database
                  let checkInTime: Date | null = null
                  if (checkInTimes[p.id]) {
                    checkInTime = checkInTimes[p.id]
                  } else if (savedAttendance?.check_in) {
                    checkInTime = new Date(savedAttendance.check_in)
                  }
                  
                  // Debug: log untuk memahami data
                  if (p.id_warga && !savedAttendance) {
                    console.log(`No saved attendance found for petugas ${p.namaLengkap} (id_warga: ${p.id_warga})`)
                  }
                  
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
