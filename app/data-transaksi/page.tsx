"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Target, History } from "lucide-react"
import type { User } from "@/types/database"

interface TransaksiStats {
  totalJimpitan: number
  targetBulanIni: number
  persentaseTarget: number
  totalTransaksi: number
}

interface Transaksi {
  id: number
  id_warga: number
  id_user: number
  tanggal_selor: string
  waktu_input: string
  nominal: string
  status_jimpitan: string
  namaWarga: string
  nikWarga: string
  jenisDana: string
  created_at: string
  updated_at: string
}

export default function DataTransaksiPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<TransaksiStats>({
    totalJimpitan: 0,
    targetBulanIni: 200000,
    persentaseTarget: 0,
    totalTransaksi: 0
  })
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Fetch transaksi data untuk warga yang login
  useEffect(() => {
    const fetchTransaksiData = async () => {
      if (!user || !user.id) return
      
      setLoading(true)
      try {
        // Fetch transaksi berdasarkan id warga
        const response = await fetch(`http://localhost:5006/api/transaksi?id_warga=${user.id}`)
        const data = await response.json()
        
        console.log('Transaksi data for user:', user.id, data)
        
        if (data.success && Array.isArray(data.data)) {
          setTransaksiList(data.data)
          
          // Hitung total jimpitan bulan ini
          const today = new Date()
          const currentMonth = today.getMonth()
          const currentYear = today.getFullYear()
          
          const totalBulanIni = data.data
            .filter((t: Transaksi) => {
              if (!t.tanggal_selor) return false
              const transaksiDate = new Date(t.tanggal_selor)
              return transaksiDate.getMonth() === currentMonth && 
                     transaksiDate.getFullYear() === currentYear &&
                     t.status_jimpitan === 'lunas'
            })
            .reduce((sum: number, t: Transaksi) => sum + (parseFloat(t.nominal) || 0), 0)
          
          setStats({
            totalJimpitan: totalBulanIni,
            targetBulanIni: 200000, // Bisa disesuaikan
            persentaseTarget: Math.round((totalBulanIni / 200000) * 100),
            totalTransaksi: data.data.length
          })
        }
      } catch (error) {
        console.error('Error fetching transaksi:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransaksiData()
  }, [user?.id])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-"
    const date = new Date(tanggal)
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatWaktu = (waktu: string) => {
    if (!waktu) return ""
    const date = new Date(waktu)
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout title="Data Transaksi" subtitle="Informasi lengkap transaksi jimpitan Anda">
      <div className="space-y-6">
        {/* Tab Content */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Bulanan</CardTitle>
                <CardDescription>
                  Total jimpitan bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Terkumpul: {formatRupiah(stats.totalJimpitan)}</span>
                    <span>{stats.totalTransaksi} transaksi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(stats.persentaseTarget, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Jimpitan bersifat sedekah, tidak ada target nominal
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
                      <Badge variant="default">LUNAS</Badge>
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
                  {transaksiList.length} transaksi ditemukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Memuat data transaksi...
                  </div>
                ) : transaksiList.length > 0 ? (
                  <div className="space-y-3">
                    {transaksiList.slice(0, 10).map((transaksi, index) => (
                      <div key={transaksi.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{transaksi.jenisDana || 'Jimpitan Harian'}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTanggal(transaksi.tanggal_selor)}
                            {transaksi.waktu_input && ` • ${formatWaktu(transaksi.waktu_input)}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatRupiah(parseFloat(transaksi.nominal))}</div>
                          <Badge variant={transaksi.status_jimpitan === "lunas" ? "default" : "destructive"} className="text-xs">
                            {transaksi.status_jimpitan === "lunas" ? "Lunas" : transaksi.status_jimpitan}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </div>
                )}
                {transaksiList.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      Lihat Semua Riwayat ({transaksiList.length} transaksi)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
