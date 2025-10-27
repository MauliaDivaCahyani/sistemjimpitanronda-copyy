"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, Users, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Member {
  namaLengkap: string
  jabatan: string
  status: "Hadir" | "Izin" | "Tidak Hadir" | "Alpha"
  check_in?: string
  check_out?: string
  keterangan?: string
}

interface KelompokRonda {
  id: number
  namaKelompok: string
  jadwalHari?: string
  totalAnggota: number
  hadirCount: number
  izinCount: number
  sakitCount: number
  alphaCount: number
  members?: Member[]
}

interface RondaInfo {
  date: string
  groups: KelompokRonda[]
  members: Array<{
    kelompokId: number
    namaKelompok: string
    namaLengkap: string
    jabatan: string
    status: string
    check_in?: string
    check_out?: string
  }>
}

interface KelompokRondaInfoProps {
  className?: string
}

export function KelompokRondaInfo({ className }: KelompokRondaInfoProps) {
  const [data, setData] = useState<{
    today: RondaInfo
    yesterday: RondaInfo
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRondaInfo()
  }, [])

  const fetchRondaInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5006/api/warga-ronda/info")
      const result = await response.json()

      if (result.success) {
        // Group members by kelompok for easier display
        const processData = (info: RondaInfo) => {
          const groupedMembers = info.members.reduce((acc, member) => {
            if (!acc[member.kelompokId]) {
              acc[member.kelompokId] = []
            }
            acc[member.kelompokId].push({
              namaLengkap: member.namaLengkap,
              jabatan: member.jabatan,
              status: member.status as any,
              check_in: member.check_in,
              check_out: member.check_out,
            })
            return acc
          }, {} as Record<number, Member[]>)

          return {
            ...info,
            groups: info.groups.map(group => ({
              ...group,
              members: groupedMembers[group.id] || []
            }))
          }
        }

        setData({
          today: processData(result.data.today),
          yesterday: processData(result.data.yesterday)
        })
      } else {
        setError(result.message || "Gagal memuat data kelompok ronda")
      }
    } catch (err) {
      console.error("Error fetching ronda info:", err)
      setError("Gagal memuat data kelompok ronda")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Hadir": { variant: "default" as const, className: "bg-green-500 text-white", label: "Hadir" },
      "Izin": { variant: "secondary" as const, className: "bg-blue-500 text-white", label: "Izin" },
      "Tidak Hadir": { variant: "secondary" as const, className: "bg-yellow-500 text-white", label: "Sakit" },
      "Alpha": { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Alpha" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Alpha
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "HH:mm", { locale: id })
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, dd MMMM yyyy", { locale: id })
    } catch {
      return dateString
    }
  }

  const getParticipationPercentage = (group: KelompokRonda) => {
    if (group.totalAnggota === 0) return 0
    return Math.round((group.hadirCount / group.totalAnggota) * 100)
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Memuat informasi kelompok ronda...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Tidak ada data kelompok ronda
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderGroupTable = (groups: KelompokRonda[], showMembers: boolean = true) => (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {group.namaKelompok}
                </CardTitle>
                {group.jadwalHari && (
                  <CardDescription>{group.jadwalHari}</CardDescription>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {getParticipationPercentage(group)}%
                </div>
                <div className="text-sm text-muted-foreground">Partisipasi</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{group.hadirCount}</div>
                <div className="text-sm text-green-700">Hadir</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{group.izinCount}</div>
                <div className="text-sm text-blue-700">Izin</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{group.sakitCount}</div>
                <div className="text-sm text-yellow-700">Sakit</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{group.alphaCount}</div>
                <div className="text-sm text-red-700">Alpha</div>
              </div>
            </div>

            {/* Members Table */}
            {showMembers && group.members && group.members.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Check-in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.members.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{member.namaLengkap}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.jabatan || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {formatTime(member.check_in)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {showMembers && (!group.members || group.members.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data anggota untuk kelompok ini
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Informasi Kelompok Ronda
          </CardTitle>
          <CardDescription>
            Status partisipasi kelompok ronda hari ini dan kemarin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">
                Hari Ini ({formatDate(data.today.date)})
              </TabsTrigger>
              <TabsTrigger value="yesterday">
                Kemarin ({formatDate(data.yesterday.date)})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {data.today.groups.length > 0 ? (
                renderGroupTable(data.today.groups)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data kelompok ronda untuk hari ini
                </div>
              )}
            </TabsContent>

            <TabsContent value="yesterday" className="space-y-4">
              {data.yesterday.groups.length > 0 ? (
                renderGroupTable(data.yesterday.groups)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data kelompok ronda untuk kemarin
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Ringkasan Partisipasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Hari Ini</div>
              <div className="text-2xl font-bold">
                {data.today.groups.reduce((acc, group) => acc + group.hadirCount, 0)} / {data.today.groups.reduce((acc, group) => acc + group.totalAnggota, 0)} Hadir
              </div>
              <div className="text-sm text-muted-foreground">
                Total {data.today.groups.length} kelompok ronda aktif
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Kemarin</div>
              <div className="text-2xl font-bold">
                {data.yesterday.groups.reduce((acc, group) => acc + group.hadirCount, 0)} / {data.yesterday.groups.reduce((acc, group) => acc + group.totalAnggota, 0)} Hadir
              </div>
              <div className="text-sm text-muted-foreground">
                Total {data.yesterday.groups.length} kelompok ronda aktif
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}