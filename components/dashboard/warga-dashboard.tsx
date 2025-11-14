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
        
        // Fetch jenis dana untuk mendapatkan target
        const jenisDanaRes = await fetch('http://localhost:5006/api/jenis-dana')
        const jenisDanaData = await jenisDanaRes.json()
        
        // Ambil jenis dana pertama sebagai default (atau yang aktif)
        let targetBulanIni = 200000 // default fallback
        if (jenisDanaData.success && Array.isArray(jenisDanaData.data) && jenisDanaData.data.length > 0) {
          const jenisDanaAktif = jenisDanaData.data.find((jd: any) => jd.isActive) || jenisDanaData.data[0]
          if (jenisDanaAktif.periodeBayar === 'bulanan') {
            targetBulanIni = parseFloat(jenisDanaAktif.nominalDefault) || 200000
          } else if (jenisDanaAktif.periodeBayar === 'harian') {
            // Jika harian, kalikan dengan jumlah hari dalam bulan ini
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
            targetBulanIni = (parseFloat(jenisDanaAktif.nominalDefault) || 2000) * daysInMonth
          }
        }
        
        const today = new Date().toISOString().split('T')[0]
        
        // Fetch transaksi bulan ini untuk user yang login
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const userTransaksiRes = await fetch(`http://localhost:5006/api/transaksi?id_warga=${user.id}`)
        const userTransaksiData = await userTransaksiRes.json()
        
        // Fetch transaksi hari ini untuk user yang login
        const userTodayRes = await fetch(`http://localhost:5006/api/transaksi?id_warga=${user.id}&tanggal=${today}`)
        const userTodayData = await userTodayRes.json()
        
        console.log('=== DEBUG DASHBOARD WARGA ===')
        console.log('Today:', today)
        console.log('User ID:', user.id)
        console.log('Target Bulan Ini:', targetBulanIni)
        console.log('Transaksi hari ini user:', userTodayData)
        
        // Hitung total jimpitan bulan ini untuk user
        let totalJimpitanBulanIni = 0
        let totalTransaksiBulanIni = 0
        
        if (userTransaksiData.success && Array.isArray(userTransaksiData.data)) {
          const transaksiBulanIni = userTransaksiData.data.filter((t: any) => {
            const tanggalSetor = t.tanggal_setor || t.tanggal_bayar
            if (!tanggalSetor) return false
            const tDate = new Date(tanggalSetor)
            if (isNaN(tDate.getTime())) return false
            return tDate.getMonth() + 1 === currentMonth && 
                   tDate.getFullYear() === currentYear
          })
          
          totalJimpitanBulanIni = transaksiBulanIni.reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          totalTransaksiBulanIni = transaksiBulanIni.length
          
          console.log('Total transaksi bulan ini:', totalTransaksiBulanIni)
          console.log('Total nominal bulan ini:', totalJimpitanBulanIni)
        }
        
        // Hitung nominal transaksi hari ini
        let nominalTransaksiHariIni = 0
        let jumlahTransaksiHariIni = 0
        if (userTodayData.success && Array.isArray(userTodayData.data)) {
          nominalTransaksiHariIni = userTodayData.data.reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          jumlahTransaksiHariIni = userTodayData.data.length
          
          console.log('Nominal transaksi hari ini:', nominalTransaksiHariIni)
          console.log('Jumlah transaksi hari ini:', jumlahTransaksiHariIni)
        }
        
        // Status bayar berdasarkan warga yang login: sudah bayar hari ini = LUNAS
        const userStatusBayar = nominalTransaksiHariIni > 0 ? 'LUNAS' : 'BELUM BAYAR'
        
        // Hitung persentase target
        const persentaseTarget = targetBulanIni > 0 ? Math.round((totalJimpitanBulanIni / targetBulanIni) * 100) : 0
        
        setStats({
          totalJimpitan: totalJimpitanBulanIni,
          targetBulanIni: targetBulanIni,
          persentaseTarget: persentaseTarget,
          totalRumah: 0,
          rumahAktif: 0,
          totalTransaksi: totalTransaksiBulanIni,
          transaksiHariIni: jumlahTransaksiHariIni,
          nominalHariIni: nominalTransaksiHariIni,
          statusBayar: userStatusBayar,
          totalWargaHariIni: 0,
          wargaBayarHariIni: 0
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
