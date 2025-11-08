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
import { useToast } from "@/hooks/use-toast"
import {
  getTodayAttendance,
  checkInAttendance,
  checkOutAttendance,
  getCurrentSession,
  getPresensi,
  markAttendance,
  type AttendanceSession,
} from "@/lib/attendance"
import { getAllPetugas, checkPetugasScheduleToday } from "@/lib/database"
import { getTodayDayName, isScheduledToday, formatScheduleDisplay } from "@/lib/schedule-utils"
import type { Presensi, User, Petugas } from "@/types/database"

interface AttendanceTrackerProps {
  user: User
}

export function AttendanceTracker({ user }: AttendanceTrackerProps) {
  const { toast } = useToast()
  const [todayAttendance, setTodayAttendance] = useState<Presensi | null>(null)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasScheduleToday, setHasScheduleToday] = useState(false)
  const [scheduleInfo, setScheduleInfo] = useState<{
    todayName: string
    jadwalHari?: string
    namaKelompok?: string
  }>({ todayName: '' })

  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [presensi, setPresensi] = useState<Presensi[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, "hadir" | "izin" | "sakit" | "alpha">>({})
  const [checkInTimes, setCheckInTimes] = useState<Record<string, Date>>({})
  const [isEditMode, setIsEditMode] = useState(false)

  // Function untuk fetch data - dipisah agar bisa dipanggil ulang
  const fetchData = async () => {
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Cek jadwal petugas yang sedang login
      
      // Untuk role petugas, cek apakah user punya jadwal hari ini
      if (user.role === 'petugas' && user.id) {
        const userScheduleCheck = await checkPetugasScheduleToday(user.id)
        setHasScheduleToday(userScheduleCheck.hasScheduleToday)
        setScheduleInfo({
          todayName: userScheduleCheck.todayName,
          jadwalHari: userScheduleCheck.jadwalHari || '',
          namaKelompok: userScheduleCheck.namaKelompok || ''
        })
      } else {
        // Admin dan super_admin selalu bisa akses
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
      }
      
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
      console.log('User role:', user.role, 'hasScheduleToday:', hasScheduleToday)
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
      
      console.log('=== FETCHING ATTENDANCE DATA ===')
      console.log('Today scheduled petugas count:', todayScheduledPetugas.length)
      console.log('Presensi data count:', presensiData.length)
      
      // Map status berdasarkan id_warga dari petugas yang terjadwal hari ini
      todayScheduledPetugas.forEach((petugas) => {
        const attendance = presensiData.find((pr) => pr.id_warga === petugas.id_warga)
        
        console.log(`Petugas: ${petugas.namaLengkap} (id_warga=${petugas.id_warga})`)
        
        if (attendance) {
          // Konversi status dari backend ke frontend format
          let frontendStatus: "hadir" | "izin" | "sakit" | "alpha" = "hadir"
          const statusString = (attendance.status as string).toLowerCase()
          
          console.log(`  - Found attendance: status="${statusString}", check_in=${attendance.check_in}`)
          
          switch (statusString) {
            case "hadir":
              frontendStatus = "hadir"
              break
            case "izin":
              frontendStatus = "izin"
              break
            case "sakit":
              frontendStatus = "sakit"
              break
            case "alpha":
            case "tidak hadir":
              frontendStatus = "alpha"
              break
            default:
              frontendStatus = "hadir"
          }
          
          statusMap[petugas.id] = frontendStatus
          if (attendance.check_in) {
            checkInMap[petugas.id] = new Date(attendance.check_in)
          }
        } else {
          console.log(`  - No attendance found, not setting default`)
          // TIDAK set default - biarkan kosong
          // Checkbox tidak akan tercentang sampai user memilih
        }
      })
      
      console.log('Final statusMap:', statusMap)
      console.log('Final checkInMap keys:', Object.keys(checkInMap))
      
      setSelectedStatuses(statusMap)
      setCheckInTimes(checkInMap)
    } catch (err) {
      setError("Gagal memuat data absensi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Event listener untuk refresh data saat halaman di-focus kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page is visible again, refreshing data...')
        fetchData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(timeInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
        // Jika di-uncheck, hapus dari state (tidak ada status yang terpilih)
        delete next[idPetugas]
      }
      return next
    })

    // Jika status hadir dipilih, simpan waktu saat ini
    if (checked && status === "hadir") {
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
    } else if (!checked) {
      // Jika di-uncheck, hapus check-in time juga
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
      // Filter petugas yang memiliki id_warga valid DAN sudah dipilih statusnya
      const validPetugas = petugas.filter(p => p.id_warga && selectedStatuses[p.id])
      
      if (validPetugas.length === 0) {
        setError("Tidak ada petugas yang dipilih untuk diabsen. Silakan pilih status absensi terlebih dahulu.")
        return
      }
      
      console.log('=== SAVING ATTENDANCE ===')
      console.log('Valid petugas to save:', validPetugas.length)
      
      await Promise.all(
        validPetugas.map((p) => {
          const status = selectedStatuses[p.id]
          const checkInTime = checkInTimes[p.id]
          console.log(`Saving attendance for ${p.namaLengkap}: status=${status}, id_warga=${p.id_warga}`)
          // Gunakan id_warga dari petugas untuk presensi
          return markAttendance(p.id_warga!, status, user.id, checkInTime)
        }),
      )
      
      setSuccess(`Absensi berhasil disimpan untuk ${validPetugas.length} petugas`)
      
      // Tunggu sebentar untuk memastikan data tersimpan di database
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Refresh data presensi untuk mendapatkan data terbaru dari database
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const newPresensi = await getPresensi({ startDate: today, endDate: tomorrow })
      setPresensi(newPresensi)
      
      console.log('Refreshed presensi data:', newPresensi.length, 'records')
      
      // Update selectedStatuses dan checkInTimes dengan data dari database
      // Agar tetap sinkron dengan yang sudah tersimpan
      const updatedStatusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
      const updatedCheckInMap: Record<string, Date> = {}
      
      petugas.forEach((petugas) => {
        const attendance = newPresensi.find((pr) => pr.id_warga === petugas.id_warga)
        if (attendance) {
          let frontendStatus: "hadir" | "izin" | "sakit" | "alpha" = "hadir"
          const statusString = (attendance.status as string).toLowerCase()
          
          switch (statusString) {
            case "hadir":
              frontendStatus = "hadir"
              break
            case "izin":
              frontendStatus = "izin"
              break
            case "sakit":
              frontendStatus = "sakit"
              break
            case "alpha":
            case "tidak hadir":
              frontendStatus = "alpha"
              break
            default:
              frontendStatus = "hadir"
          }
          
          updatedStatusMap[petugas.id] = frontendStatus
          if (attendance.check_in) {
            updatedCheckInMap[petugas.id] = new Date(attendance.check_in)
          }
        }
        // TIDAK set default jika tidak ada di database
      })
      
      setSelectedStatuses(updatedStatusMap)
      setCheckInTimes(updatedCheckInMap)
      
      console.log('Updated status map after save:', updatedStatusMap)
      
    } catch (err) {
      console.error('Error saving attendance:', err)
      setError("Gagal menyimpan absensi massal")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditMode = () => {
    setIsEditMode(true)
    toast({
      title: "Mode Edit Diaktifkan",
      description: "Anda sekarang dapat mengubah status absensi yang sudah tersimpan. Jangan lupa klik 'Simpan Absensi' setelah selesai mengedit.",
      duration: 5000,
    })
  }

  const getStatusBadge = (status: string) => {
    // Normalize status untuk menangani variasi dari backend
    const normalizedStatus = status.toLowerCase()
    
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-primary", label: "Hadir" },
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

  // Jika user adalah petugas dan tidak memiliki jadwal hari ini
  if (user.role === 'petugas' && !hasScheduleToday) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Calendar className="h-5 w-5" />
              Tidak Ada Jadwal Ronda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-orange-300 bg-orange-100">
                <Calendar className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <div className="font-semibold mb-2">Hari ini bukan jadwal ronda Anda. Anda tidak dapat melakukan absensi.</div>
                  <div className="space-y-1 text-sm">
                    <div>• Hari ini: <strong>{scheduleInfo.todayName}</strong></div>
                    {scheduleInfo.namaKelompok && (
                      <div>• Kelompok Anda: <strong>{scheduleInfo.namaKelompok}</strong></div>
                    )}
                    {scheduleInfo.jadwalHari && (
                      <div>• Jadwal ronda Anda: <strong>{scheduleInfo.jadwalHari}</strong></div>
                    )}
                    {!scheduleInfo.jadwalHari && (
                      <div className="text-red-600">• Anda belum terdaftar dalam kelompok ronda manapun</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground">
                <p>Silakan hubungi admin jika ada kesalahan pada jadwal ronda Anda.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tampilkan informasi sesi untuk referensi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informasi Sesi Ronda
            </CardTitle>
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
                    <Badge variant="default" className="bg-primary mb-2">
                      Sesi Aktif
                    </Badge>
                    <div className="text-sm">
                      <div>Waktu: {currentSession.startTime} - {currentSession.endTime}</div>
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
                  <Badge variant="default" className="bg-primary mb-2">
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
              {user.role !== 'petugas' && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Anda login sebagai {user.role === 'admin' ? 'Admin' : 'Super Admin'} - dapat mengelola semua absensi
                  </Badge>
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleEditMode}
              disabled={actionLoading || petugas.filter(p => p.id_warga).length === 0}
            >
              Edit
            </Button>
            <Button 
              onClick={handleSaveAll} 
              disabled={actionLoading || petugas.filter(p => p.id_warga).length === 0 || Object.keys(selectedStatuses).length === 0}
            >
              {actionLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan Absensi"
              )}
            </Button>
          </div>
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
            <Alert className="border-primary/20 bg-primary/10 mt-4">
              <UserCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">{success}</AlertDescription>
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
                  const savedAttendance = filteredPresensi.find((pr) => pr.id_warga === p.id_warga)
                  
                  // Prioritaskan status dari database (sudah disimpan)
                  // Jika tidak ada di database, gunakan status yang dipilih user (belum disimpan)
                  let displayStatus: "hadir" | "izin" | "sakit" | "alpha" | null = null
                  
                  if (savedAttendance) {
                    // Ada data dari database - konversi dari backend format
                    const statusString = (savedAttendance.status as string).toLowerCase()
                    switch (statusString) {
                      case "hadir":
                        displayStatus = "hadir"
                        break
                      case "izin":
                        displayStatus = "izin"
                        break
                      case "sakit":
                        displayStatus = "sakit"
                        break
                      case "alpha":
                      case "tidak hadir":
                        displayStatus = "alpha"
                        break
                      default:
                        displayStatus = "hadir"
                    }
                  } else if (selectedStatuses[p.id]) {
                    // Belum ada di database, tapi ada status yang dipilih user
                    displayStatus = selectedStatuses[p.id]
                  }
                  
                  // Untuk check-in time, prioritaskan yang dari database, kemudian yang baru dipilih
                  let checkInTime: Date | null = null
                  if (savedAttendance?.check_in) {
                    checkInTime = new Date(savedAttendance.check_in)
                  } else if (checkInTimes[p.id]) {
                    checkInTime = checkInTimes[p.id]
                  }
                  
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.namaLengkap}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {checkInTime ? format(checkInTime, "HH:mm:ss", { locale: id }) : "-"}
                      </TableCell>
                      <TableCell>
                        {displayStatus ? getStatusBadge(displayStatus) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                            Belum Diabsen
                          </Badge>
                        )}
                      </TableCell>
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
