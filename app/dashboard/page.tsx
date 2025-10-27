"use client"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WargaDashboard } from "@/components/dashboard/warga-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, Wallet, TrendingUp, Clock, QrCode, Receipt } from "lucide-react"
import { getAllKelompokRonda } from "@/lib/database"
import type { User } from "@/types/database"

interface DashboardStats {
  totalWarga: number
  totalRumah: number
  totalDanaHariIni: number
  totalDanaBulanIni: number
  absensiHariIni: number
  transaksiHariIni: number
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat pagi"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

const getDayName = (date: Date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return days[date.getDay()]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalWarga: 0,
    totalRumah: 0,
    totalDanaHariIni: 0,
    totalDanaBulanIni: 0,
    absensiHariIni: 0,
    transaksiHariIni: 0,
  })
  const [kelompokRondaList, setKelompokRondaList] = useState<any[]>([])
  const [userKelompok, setUserKelompok] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // Mock data - in real app, fetch from API
    setStats({
      totalWarga: 125,
      totalRumah: 50,
      totalDanaHariIni: 75000,
      totalDanaBulanIni: 2250000,
      absensiHariIni: 8,
      transaksiHariIni: 25,
    })

    const fetchKelompokRonda = async () => {
      try {
        const data = await getAllKelompokRonda()
        setKelompokRondaList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Gagal memuat kelompok ronda:", error)
      }
    }

    fetchKelompokRonda()
  }, [])

  useEffect(() => {
    if (user && (user as any).idKelompokRonda && kelompokRondaList.length > 0) {
      const kelompok = kelompokRondaList.find((k) => k.id === (user as any).idKelompokRonda)
      setUserKelompok(kelompok)
    }
  }, [user, kelompokRondaList])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPaymentStatus = (paid: number, target: number) => {
    if (!target || target <= 0) {
      return {
        percentRaw: 0,
        percentDisplay: 0,
        overpay: 0,
        isOverpay: false,
        isPaid: false,
      }
    }
    const percentRaw = Math.round((paid / target) * 100)
    const percentDisplay = Math.min(percentRaw, 100)
    const overpay = Math.max(paid - target, 0)
    return {
      percentRaw,
      percentDisplay,
      overpay,
      isOverpay: overpay > 0,
      isPaid: percentRaw >= 100,
    }
  }

  const renderPetugasDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transaksiHariIni}</div>
            <p className="text-xs text-muted-foreground">Transaksi berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Terkumpul</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaHariIni)}</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Absensi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hadir</div>
            <p className="text-xs text-muted-foreground">Shift malam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Barcode</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/scan-barcode")}>
              Mulai Scan
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kelompok Ronda Hari Ini</CardTitle>
            <CardDescription>
              {getDayName(new Date())}, {new Date().toLocaleDateString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userKelompok ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{userKelompok.namaKelompok}</span>
                  <Badge className="bg-emerald-500">Aktif</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{userKelompok.keteranganKelompok}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Anda tidak terdaftar dalam kelompok ronda manapun</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jadwal Ronda</CardTitle>
            <CardDescription>Jadwal ronda minggu ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((day, i) => (
                <div key={day} className="flex items-center justify-between">
                  <span>{day}</span>
                  <Badge variant={i === 2 ? "default" : "secondary"}>{i === 2 ? "Hari Ini" : "19:00-06:00"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWarga}</div>
            <p className="text-xs text-muted-foreground">Warga aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rumah</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRumah}</div>
            <p className="text-xs text-muted-foreground">Rumah terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Hari Ini</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaHariIni)}</div>
            <p className="text-xs text-muted-foreground">+12% dari kemarin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaBulanIni)}</div>
            <p className="text-xs text-muted-foreground">Target: 3.000.000</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Pembayaran</CardTitle>
            <CardDescription>Status pembayaran warga bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Sudah Bayar</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-green-200 rounded-full">
                    <div className="h-2 w-16 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm">80%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Belum Bayar</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-red-200 rounded-full">
                    <div className="h-2 w-4 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-sm">20%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderDashboardContent = () => {
    if (!user) return null

    switch (user.role) {
      case "warga":
        return <WargaDashboard user={user} />
      case "petugas":
        return renderPetugasDashboard()
      case "admin":
      case "super_admin":
        return renderAdminDashboard()
      default:
        return renderAdminDashboard()
    }
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`${getGreeting()}, ${user?.namaLengkap || user?.username || "User"}`}>
      {renderDashboardContent()}
    </DashboardLayout>
  )
}
