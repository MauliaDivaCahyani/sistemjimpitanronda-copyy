"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Home, Target, History, UserCheck } from "lucide-react"
import { KelompokRondaInfo } from "@/components/ronda/kelompok-ronda-info"
import type { User } from "@/types/database"

interface DashboardStats {
  totalJimpitan: number
  targetBulanIni: number
  persentaseTarget: number
  totalRumah: number
  rumahAktif: number
  totalTransaksi: number
  transaksiHariIni: number
}

interface WargaDashboardProps {
  user: User
}

export function WargaDashboard({ user }: WargaDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJimpitan: 150000,
    targetBulanIni: 200000,
    persentaseTarget: 75,
    totalRumah: 45,
    rumahAktif: 42,
    totalTransaksi: 15,
    transaksiHariIni: 3
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      try {
        setLoading(true)
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // In real implementation, fetch from API
        // const response = await fetch('/api/dashboard/warga')
        // const data = await response.json()
        // setStats(data)
        
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Memuat dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Selamat datang, {user.namaLengkap || user.username}!
          </CardTitle>
          <CardDescription>
            Dashboard warga - Lihat informasi jimpitan dan kelompok ronda
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.totalJimpitan)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% dari bulan lalu
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Bulan Ini</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.persentaseTarget}%</div>
            <p className="text-xs text-muted-foreground">
              {formatRupiah(stats.targetBulanIni)} target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Bayar</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default" className="bg-green-500 text-white">
                LUNAS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Oktober 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transaksiHariIni}</div>
            <p className="text-xs text-muted-foreground">
              Total {stats.totalTransaksi} bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress & Target</TabsTrigger>
          <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="ronda">Kelompok Ronda</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Target Bulanan</CardTitle>
              <CardDescription>
                Target jimpitan bulan ini: {formatRupiah(stats.targetBulanIni)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Terkumpul: {formatRupiah(stats.totalJimpitan)}</span>
                  <span>{stats.persentaseTarget}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(stats.persentaseTarget, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Sisa: {formatRupiah(stats.targetBulanIni - stats.totalJimpitan)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Status Pembayaran */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Status Pembayaran</CardTitle>
              <CardDescription>
                Informasi lengkap pembayaran jimpitan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="default" className="bg-green-500">LUNAS</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Bulan:</span>
                    <span className="text-sm">Oktober 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tanggal Bayar:</span>
                    <span className="text-sm">15 Oktober 2025</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Jumlah:</span>
                    <span className="text-sm font-bold">{formatRupiah(stats.totalJimpitan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Metode:</span>
                    <span className="text-sm">Transfer Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">No. Ref:</span>
                    <span className="text-sm text-muted-foreground">JMP202510001</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>
                10 transaksi terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tanggal: "2025-10-27", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-26", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-25", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-24", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-23", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-22", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-21", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-20", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-19", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                  { tanggal: "2025-10-18", jenis: "Jimpitan Harian", jumlah: 1000, status: "Berhasil" },
                ].map((transaksi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{transaksi.jenis}</div>
                      <div className="text-sm text-muted-foreground">{transaksi.tanggal}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatRupiah(transaksi.jumlah)}</div>
                      <Badge variant={transaksi.status === "Berhasil" ? "default" : "destructive"} className="text-xs">
                        {transaksi.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  Lihat Semua Riwayat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ronda" className="space-y-4">
          <KelompokRondaInfo />
        </TabsContent>
      </Tabs>
    </div>
  )
}