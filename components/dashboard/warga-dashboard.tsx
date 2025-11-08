"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Target, UserCheck, Calendar } from "lucide-react"
import type { User } from "@/types/database"

interface DashboardStats {
  totalJimpitan: number
  targetBulanIni: number
  persentaseTarget: number
  totalRumah: number
  rumahAktif: number
  totalTransaksi: number
  transaksiHariIni: number
  nominalHariIni: number
  statusBayar: 'LUNAS' | 'BELUM BAYAR'
  totalWargaHariIni: number
  wargaBayarHariIni: number
}

interface WargaDashboardProps {
  user: User
}

export function WargaDashboard({ user }: WargaDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJimpitan: 0,
    targetBulanIni: 200000,
    persentaseTarget: 0,
    totalRumah: 0,
    rumahAktif: 0,
    totalTransaksi: 0,
    transaksiHariIni: 0,
    nominalHariIni: 0,
    statusBayar: 'BELUM BAYAR',
    totalWargaHariIni: 0,
    wargaBayarHariIni: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Fetch transaksi hari ini untuk semua warga
        const today = new Date().toISOString().split('T')[0]
        const transaksiRes = await fetch(`http://localhost:5006/api/transaksi?tanggal=${today}`)
        const transaksiData = await transaksiRes.json()
        
        // Fetch total warga aktif
        const wargaRes = await fetch('http://localhost:5006/api/warga')
        const wargaData = await wargaRes.json()
        
        // Fetch transaksi untuk user yang login (semua transaksi)
        const userTransaksiRes = await fetch(`http://localhost:5006/api/transaksi?id_warga=${user.id}`)
        const userTransaksiData = await userTransaksiRes.json()
        
        // Fetch transaksi hari ini untuk user yang login (gunakan filter tanggal)
        const userTodayRes = await fetch(`http://localhost:5006/api/transaksi?id_warga=${user.id}&tanggal=${today}`)
        const userTodayData = await userTodayRes.json()
        
        console.log('=== DEBUG DASHBOARD WARGA ===')
        console.log('Today:', today)
        console.log('User ID:', user.id)
        console.log('Transaksi hari ini user:', userTodayData)
        
        let totalWargaAktif = 0
        let wargaBayarHariIni = 0
        
        if (wargaData.success && Array.isArray(wargaData.data)) {
          totalWargaAktif = wargaData.data.filter((w: any) => w.statusAktif === 'Aktif').length
        }
        
        if (transaksiData.success && Array.isArray(transaksiData.data)) {
          // Hitung jumlah warga unik yang sudah bayar hari ini
          const uniqueWarga = new Set(transaksiData.data.map((t: any) => t.id_warga))
          wargaBayarHariIni = uniqueWarga.size
        }
        
        // Status bayar: LUNAS jika semua warga aktif sudah bayar hari ini
        const statusBayar = (totalWargaAktif > 0 && wargaBayarHariIni >= totalWargaAktif) ? 'LUNAS' : 'BELUM LUNAS'
        
        // Hitung total jimpitan bulan ini untuk user
        let totalJimpitanBulanIni = 0
        let totalTransaksiBulanIni = 0
        let nominalTransaksiHariIni = 0
        
        if (userTransaksiData.success && Array.isArray(userTransaksiData.data)) {
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          
          const transaksiBulanIni = userTransaksiData.data.filter((t: any) => {
            if (!t.tanggal_selor) return false
            const tDate = new Date(t.tanggal_selor)
            if (isNaN(tDate.getTime())) return false
            return tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear &&
                   t.status_jimpitan === 'lunas'
          })
          
          totalJimpitanBulanIni = transaksiBulanIni.reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          totalTransaksiBulanIni = transaksiBulanIni.length
        }
        
        // Hitung nominal transaksi hari ini dari API filter tanggal
        if (userTodayData.success && Array.isArray(userTodayData.data)) {
          nominalTransaksiHariIni = userTodayData.data
            .filter((t: any) => t.status_jimpitan === 'lunas')
            .reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          
          console.log('Nominal transaksi hari ini:', nominalTransaksiHariIni)
        }
        
        // Status bayar berdasarkan warga yang login: sudah bayar hari ini = LUNAS
        const userStatusBayar = nominalTransaksiHariIni > 0 ? 'LUNAS' : 'BELUM BAYAR'
        
        setStats({
          totalJimpitan: totalJimpitanBulanIni,
          targetBulanIni: 200000,
          persentaseTarget: Math.round((totalJimpitanBulanIni / 200000) * 100),
          totalRumah: wargaData.success ? wargaData.data.length : 0,
          rumahAktif: totalWargaAktif,
          totalTransaksi: totalTransaksiBulanIni,
          transaksiHariIni: transaksiData.success ? transaksiData.data.filter((t: any) => t.id_warga === user.id).length : 0,
          nominalHariIni: nominalTransaksiHariIni,
          statusBayar: userStatusBayar,
          totalWargaHariIni: totalWargaAktif,
          wargaBayarHariIni
        })
        
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.id) {
      fetchStats()
      
      // Auto refresh setiap 1 menit
      const interval = setInterval(fetchStats, 60000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Selamat datang, {(user as any).nama || user.namaLengkap || user.username}!
          </CardTitle>
          <CardDescription>
            Dashboard warga - Lihat informasi jimpitan Anda
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            <span className="text-lg font-bold text-muted-foreground">Rp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.totalJimpitan)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Bulan Ini</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.persentaseTarget}%</div>
            <p className="text-xs text-muted-foreground">{formatRupiah(stats.targetBulanIni)} target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Bayar</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge 
                variant={stats.statusBayar === 'LUNAS' ? 'default' : 'destructive'} 
                className={stats.statusBayar === 'LUNAS' ? 'bg-primary text-white' : 'bg-red-500 text-white'}
              >
                {stats.statusBayar}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.statusBayar === 'LUNAS' ? 'Anda sudah bayar hari ini' : 'Anda belum bayar hari ini'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.nominalHariIni)}</div>
            <p className="text-xs text-muted-foreground">Total {stats.totalTransaksi} bulan ini</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
