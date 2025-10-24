"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { getAllPetugas, createPetugas, updatePetugas, deletePetugas } from "@/lib/database"
import type { User } from "@/types/database"

export default function DataPetugasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPetugas, setSelectedPetugas] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    id_warga: undefined as number | undefined,
    namaLengkap: "",
    username: "",
    password: "",
    jabatan: "",
    status: "aktif" as "aktif" | "nonaktif",
    role: "petugas" as "petugas" | "admin" | "super_admin",
  })

  const [wargaList, setWargaList] = useState<{ id_warga: number; nama_lengkap: string }[]>([])
  const fetchWarga = async () => {
    try {
      const res = await fetch("http://localhost:5006/api/warga") // endpoint warga
      const result = await res.json()
      if (result.success) setWargaList(result.data)
    } catch (err) {
      console.error("Gagal memuat data warga:", err)
    }
  }
  const [petugas, setPetugas] = useState<User[]>([])

  const fetchPetugas = async () => {
    try {
      const data = await getAllPetugas()
      // ubah field "status" dari API jadi boolean "statusUser"
      const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        statusUser: item.status?.toLowerCase() === "aktif",
        namaLengkap: item.namaWarga ?? "Tidak diketahui",
      }))

      setPetugas(mappedData)
    } catch (err) {
      console.error("Gagal memuat data petugas:", err)
      setPetugas([])
    }
  }



  useEffect(() => {
    fetchPetugas()
    fetchWarga()
  }, [])

  const filteredPetugas = petugas.filter(
    (p) =>
      p.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAdd = async () => {
    if (!formData.id_warga) {
      alert("Silakan pilih warga terlebih dahulu.")
      return
    }
    if (!formData.username) {
      alert("Username wajib diisi.")
      return
    }
    if (!formData.jabatan) {
      alert("Jabatan wajib diisi.")
      return
    }
    try {
      const payload = {
        id_warga: formData.id_warga, // dikirim ke backend
        id_kelompok_ronda: null,
        jabatan: formData.jabatan,
        role: formData.role,
        username: formData.username,
        password: formData.password,
        statusUser: formData.status === "aktif", // convert ke boolean
      }
      delete (payload as any).status // hapus property status
      await createPetugas(payload)
      await fetchPetugas()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      console.error("Gagal menambah petugas:", err)
    }
  }

  const handleDetail = (petugas: User) => {
    setSelectedPetugas(petugas)
    setIsDetailDialogOpen(true)
  }

  const handleEdit = (petugas: User) => {
    setSelectedPetugas(petugas)
    setFormData({
      id_warga: 0,
      namaLengkap: petugas.namaLengkap,
      username: petugas.username ?? "",
      password: "",
      jabatan: petugas.jabatan ?? "",
      status: petugas.statusUser ? "aktif" : "nonaktif",
      role: petugas.role as "petugas" | "admin" | "super_admin",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (selectedPetugas) {
      await updatePetugas(selectedPetugas.id, {
        ...formData,
        statusUser: formData.status === "aktif",
      })
      await fetchPetugas()
      setIsEditDialogOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus petugas ini?")) {
      await deletePetugas(id)
      await fetchPetugas()
    }
  }

  const resetForm = () => {
    setFormData({
      id_warga: 0,
      namaLengkap: "",
      username: "",
      password: "",
      jabatan: "",
      status: "aktif",
      role: "petugas",
    })
    setSelectedPetugas(null)
  }

  return (
    <DashboardLayout title="Data Petugas">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="relative w-full sm:w-auto mb-3 sm:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari nama, username, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 md:w-80"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Petugas
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Petugas Baru</DialogTitle>
              <DialogDescription>Masukkan informasi petugas baru</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="id_warga" className="sm:text-right">
                  Nama Warga
                </Label>
                <Select
                  value={formData.id_warga ? String(formData.id_warga) : undefined}
                  onValueChange={(value) => setFormData({ ...formData, id_warga: Number(value) })}
                >
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Pilih warga" />
                  </SelectTrigger>
                  <SelectContent>
                    {wargaList.map((w, index) => (
                      <SelectItem key={`warga-${w.id_warga || index}`} value={String(w.id_warga)}>
                        {w.nama_lengkap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="sm:text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="sm:text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="jabatan" className="sm:text-right">
                  Jabatan
                </Label>
                <Select
                  value={formData.jabatan}
                  onValueChange={(value) => setFormData({ ...formData, jabatan: value })}
                >
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ketua RT">Ketua RT</SelectItem>
                    <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                    <SelectItem value="Bendahara">Bendahara</SelectItem>
                    <SelectItem value="Koordinator Ronda">Koordinator Ronda</SelectItem>
                    <SelectItem value="Anggota Ronda">Anggota Ronda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="sm:text-right">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "petugas" | "admin" | "super_admin") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petugas">Petugas</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAdd}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Petugas</CardTitle>
          <CardDescription>Total {filteredPetugas.length} petugas terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPetugas.map((petugas) => (
              <div key={petugas.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`/abstract-geometric-shapes.png?height=48&width=48&query=${petugas.namaLengkap}`}
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {(petugas.namaLengkap ?? petugas.username ?? "P")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{petugas.namaLengkap}</h3>
                      <p className="text-sm text-gray-600">{petugas.jabatan ?? "N/A"}</p>
                    </div>
                  </div>
                  <Badge
                    variant={petugas.statusUser ? "default" : "secondary"}
                    className="bg-emerald-100 text-emerald-700"
                  >
                    {petugas.statusUser ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Avatar className="h-4 w-4 mr-2">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {(petugas.username?.[0] ?? "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {petugas.username ?? "N/A"}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleDetail(petugas)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleEdit(petugas)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDelete(petugas.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Petugas</DialogTitle>
            <DialogDescription>Informasi lengkap petugas</DialogDescription>
          </DialogHeader>
          {selectedPetugas && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`/.jpg?key=9afnj&height=64&width=64&query=${selectedPetugas.namaLengkap}`} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                      {(selectedPetugas?.namaLengkap ?? selectedPetugas?.username ?? "P")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedPetugas.namaLengkap}</h3>
                    <p className="text-muted-foreground">{selectedPetugas.jabatan ?? "N/A"}</p>
                  </div>
                </div>
                <Badge
                  variant={selectedPetugas.statusUser ? "default" : "secondary"}
                  className="bg-emerald-500 text-white"
                >
                  {selectedPetugas.statusUser ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <span className="font-medium">{selectedPetugas.username ?? "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jabatan:</span>
                  <span className="font-medium">{selectedPetugas.jabatan ?? "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">
                    {selectedPetugas.role === "super_admin"
                      ? "Super Admin"
                      : selectedPetugas.role === "admin"
                        ? "Admin"
                        : "Petugas"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsDetailDialogOpen(false)
                if (selectedPetugas) handleEdit(selectedPetugas)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Petugas</DialogTitle>
            <DialogDescription>Ubah informasi petugas</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_namaLengkap" className="sm:text-right">
                Nama Lengkap
              </Label>
              <Input
                id="edit_namaLengkap"
                value={formData.namaLengkap}
                onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                className="sm:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_username" className="sm:text-right">
                Username
              </Label>
              <Input
                id="edit_username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="sm:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_jabatan" className="sm:text-right">
                Jabatan
              </Label>
              <Select value={formData.jabatan} onValueChange={(value) => setFormData({ ...formData, jabatan: value })}>
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ketua RT">Ketua RT</SelectItem>
                  <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                  <SelectItem value="Bendahara">Bendahara</SelectItem>
                  <SelectItem value="Koordinator Ronda">Koordinator Ronda</SelectItem>
                  <SelectItem value="Anggota Ronda">Anggota Ronda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_role" className="sm:text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "petugas" | "admin" | "super_admin") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petugas">Petugas</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_status" className="sm:text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
