"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CheckCircle, XCircle, MapPin, Users, Timer } from "lucide-react"
import {
  getTodayAttendance,
  checkInAttendance,
  checkOutAttendance,
  getCurrentSession,
  type AttendanceSession,
} from "@/lib/attendance"
import type { Presensi, User } from "@/types/database"

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendance, session] = await Promise.all([getTodayAttendance(user.id), getCurrentSession()])

        setTodayAttendance(attendance)
        setCurrentSession(session)
      } catch (err) {
        setError("Gagal memuat data absensi")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [user.id])

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateWorkDuration = (checkIn: Date, checkOut?: Date | null) => {
    const endTime = checkOut || new Date()
    const duration = endTime.getTime() - checkIn.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
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

      {/* Attendance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Absensi Hari Ini
          </CardTitle>
          <CardDescription>Check-in dan check-out untuk sesi ronda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {todayAttendance ? (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Status: Sudah Absen</span>
                </div>
                <Badge variant="default" className="bg-green-500">
                  {todayAttendance.status === "hadir" ? "Hadir" : todayAttendance.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Check-in: </span>
                  <span className="font-mono">{formatTime(todayAttendance.check_in)}</span>
                </div>
                {todayAttendance.check_out ? (
                  <div>
                    <span className="text-muted-foreground">Check-out: </span>
                    <span className="font-mono">{formatTime(todayAttendance.check_out)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-muted-foreground">Check-out: </span>
                    <span className="text-yellow-600">Belum check-out</span>
                  </div>
                )}
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Durasi: </span>
                  <span>{calculateWorkDuration(todayAttendance.check_in, todayAttendance.check_out)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Status: Belum Absen</span>
              </div>
              <p className="text-sm text-muted-foreground">Anda belum melakukan absensi hari ini</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!todayAttendance ? (
              <Button onClick={handleCheckIn} disabled={actionLoading || !currentSession} className="flex-1">
                {actionLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check-in
                  </>
                )}
              </Button>
            ) : !todayAttendance.check_out ? (
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                {actionLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4 mr-2" />
                    Check-out
                  </>
                )}
              </Button>
            ) : (
              <div className="flex-1 text-center py-2 text-muted-foreground">Absensi hari ini sudah lengkap</div>
            )}
          </div>

          {/* Restrictions Info */}
          {!currentSession && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Absensi hanya dapat dilakukan saat sesi ronda aktif (19:00 - 06:00) dan harus dilakukan di pos ronda.
              </AlertDescription>
            </Alert>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
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

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Petunjuk Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Absensi hanya dapat dilakukan saat datang ke pos ronda</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Waktu absensi: 19:00 - 06:00 (sesi ronda malam)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Tidak dapat mengubah tanggal absensi (hanya hari ini)</span>
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
