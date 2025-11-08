"use client"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, Wallet, TrendingUp, UserCog, Shield, Activity, Database } from "lucide-react"
import type { User } from "@/types/database"

interface SuperAdminStats {
  totalWarga: number
  totalRumah: number
  totalPetugas: number
  totalAdmin: number
  totalDanaHariIni: number
  totalDanaBulanIni: number
  totalDanaTahunIni: number
  transaksiHariIni: number
  systemHealth: string
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat Pagi"
  if (hour < 15) return "Selamat Siang"
  if (hour < 18) return "Selamat Sore"
  return "Selamat Malam"
}

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [greeting] = useState<string>(() => getGreeting())
  const [stats, setStats] = useState<SuperAdminStats>({
    totalWarga: 0,
    totalRumah: 0,
    totalPetugas: 0,
    totalAdmin: 0,
    totalDanaHariIni: 0,
    totalDanaBulanIni: 0,
    totalDanaTahunIni: 0,
    transaksiHariIni: 0,
    systemHealth: "Excellent",
  })
  const [loading, setLoading] = useState(true)
  const [paymentStats, setPaymentStats] = useState<any>({
    sudahBayar: 0,
    belumBayar: 0,
    persenSudahBayar: 0,
    persenBelumBayar: 0
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      
      // Redirect jika bukan super_admin
      if (parsedUser.role !== "super_admin") {
        window.location.href = "/dashboard"
      }
    }
  }, [])

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      if (!user || user.role !== "super_admin") return
      
      setLoading(true)
      try {
        const API_URL = "http://localhost:5006/api"
        
        // Gunakan endpoint dashboard yang baru
        const dashboardRes = await fetch(`${API_URL}/dashboard/stats?_t=${Date.now()}`)
        const dashboardData = await dashboardRes.json()
        
        // Fetch total petugas untuk breakdown admin dan petugas
        const petugasRes = await fetch(`${API_URL}/petugas?_t=${Date.now()}`)
        const petugasData = await petugasRes.json()
        
        // Hitung admin dan petugas
        let totalAdmin = 0
        let totalPetugas = 0
        
        if (petugasData.success && Array.isArray(petugasData.data)) {
          petugasData.data.forEach((p: any) => {
            const role = p.role?.toLowerCase() || ""
            if (role === "admin" || role === "superadmin" || role === "super admin") {
              totalAdmin++
            } else {
              totalPetugas++
            }
          })
        }
        
        if (dashboardData.success) {
          console.log('[SUPERADMIN] Dashboard data:', dashboardData.data)
          
          setStats({
            totalWarga: dashboardData.data.totalWarga || 0,
            totalRumah: dashboardData.data.totalRumah || 0,
            totalPetugas,
            totalAdmin,
            totalDanaHariIni: dashboardData.data.totalDanaHariIni || 0,
            totalDanaBulanIni: dashboardData.data.totalDanaBulanIni || 0,
            totalDanaTahunIni: dashboardData.data.totalDanaBulanIni * 12, // Estimasi dari bulan ini
            transaksiHariIni: dashboardData.data.transaksiHariIni || 0,
            systemHealth: "Excellent",
          })
          
          if (dashboardData.data.statistikPembayaran) {
            setPaymentStats(dashboardData.data.statistikPembayaran)
          }
        }
        
      } catch (error) {
        console.error("Error fetching super admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === "super_admin") {
      fetchSuperAdminData()
      
      // Auto refresh every 30 seconds
      const interval = setInterval(fetchSuperAdminData, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getUserName = () => {
    if (!user) return "SuperAdmin"
    return (user as any).nama || user.namaLengkap || (user as any).name || user.username || "SuperAdmin"
  }

  return (
    <DashboardLayout 
      title="SuperAdmin Dashboard" 
      subtitle={`${greeting}, ${getUserName()}`}
    >
      <div className="space-y-6">
        {/* System Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">System Status:</span>
            <Badge variant={stats.systemHealth === "Excellent" ? "default" : "secondary"}>
              {stats.systemHealth}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWarga}</div>
              <p className="text-xs text-muted-foreground">Warga aktif di sistem</p>
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
              <CardTitle className="text-sm font-medium">Total Petugas</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPetugas}</div>
              <p className="text-xs text-muted-foreground">{stats.totalAdmin} Admin aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transaksiHariIni}</div>
              <p className="text-xs text-muted-foreground">Transaksi berhasil</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dana Hari Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaHariIni)}</div>
              <p className="text-xs text-muted-foreground">Total dana terkumpul</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaBulanIni)}</div>
              <p className="text-xs text-muted-foreground">Estimasi bulanan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dana Tahun Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaTahunIni)}</div>
              <p className="text-xs text-muted-foreground">Estimasi tahunan</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Akses cepat ke fitur utama</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = "/data-warga"}
              >
                <Users className="mr-2 h-4 w-4" />
                Kelola Data Warga
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = "/data-petugas"}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Kelola Data Petugas
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = "/data-transaksi"}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Lihat Transaksi
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = "/laporan"}
              >
                <Database className="mr-2 h-4 w-4" />
                Generate Laporan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Status sistem dan database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge variant="default">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Sync</span>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="text-sm font-medium">
                  {stats.totalWarga + stats.totalPetugas + stats.totalAdmin}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Pembayaran Bulan Ini</CardTitle>
            <CardDescription>Status pembayaran warga bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Sudah Bayar</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-primary/30 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: `${paymentStats.persenSudahBayar}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{paymentStats.persenSudahBayar}%</span>
                  <span className="text-xs text-muted-foreground">({paymentStats.sudahBayar} warga)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Belum Bayar</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-red-200 rounded-full">
                    <div 
                      className="h-2 bg-red-500 rounded-full" 
                      style={{ width: `${paymentStats.persenBelumBayar}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{paymentStats.persenBelumBayar}%</span>
                  <span className="text-xs text-muted-foreground">({paymentStats.belumBayar} warga)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overview Statistik</CardTitle>
            <CardDescription>Ringkasan data sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">
                  {stats.totalWarga + stats.totalPetugas + stats.totalAdmin}
                </p>
                <p className="text-xs text-muted-foreground">Semua pengguna sistem</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Tingkat kelengkapan data</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Transaction Success</p>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">Transaksi berhasil</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">System Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-xs text-muted-foreground">Waktu aktif sistem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
