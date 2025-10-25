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
} from "@/components/ui/dialog"
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { getAllPetugas, createPetugas, updatePetugas, deletePetugas, getAllKelompokRonda } from "@/lib/database"
import { PetugasForm } from "@/components/forms/petugas-form"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/types/database"

export default function DataPetugasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPetugas, setSelectedPetugas] = useState<User | null>(null)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [kelompokRondaList, setKelompokRondaList] = useState<any[]>([])

  const [petugas, setPetugas] = useState<User[]>([])

  const fetchPetugas = async () => {
    try {
      const data = await getAllPetugas()
      const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        statusUser: item.status?.toLowerCase() === "aktif",
        namaLengkap: item.namaWarga || item.namaLengkap || "Tidak diketahui",
      }))

      setPetugas(mappedData)
    } catch (err) {
      console.error("Gagal memuat data petugas:", err)
      setPetugas([])
    }
  }

  const fetchKelompokRonda = async () => {
    try {
      const data = await getAllKelompokRonda()
      setKelompokRondaList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Gagal memuat kelompok ronda:", err)
    }
  }

  useEffect(() => {
    fetchPetugas()
    fetchKelompokRonda()
  }, [])

  const filteredPetugas = petugas.filter(
    (p) =>
      p.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getKelompokRondaName = (kelompokId: string) => {
    const kelompok = kelompokRondaList.find((k) => k.id === kelompokId)
    return kelompok ? kelompok.namaKelompok : "Tidak ada"
  }

  const handleCreate = () => {
    setFormMode("create")
    setSelectedPetugas(null)
    setIsAddDialogOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === "create") {
        await createPetugas(data)
        toast({
          title: "Berhasil",
          description: "Petugas berhasil ditambahkan",
        })
      } else if (selectedPetugas) {
        await updatePetugas(selectedPetugas.id, data)
        toast({
          title: "Berhasil",
          description: "Data petugas berhasil diperbarui",
        })
      }

      await fetchPetugas()
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data petugas",
        variant: "destructive",
      })
    }
  }

  const handleDetail = (petugas: User) => {
    setSelectedPetugas(petugas)
    setIsDetailDialogOpen(true)
  }

  const handleEdit = (petugas: User) => {
    setFormMode("edit")
    setSelectedPetugas(petugas)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus petugas ini?")) {
      try {
        await deletePetugas(id)
        toast({
          title: "Berhasil",
          description: "Petugas berhasil dihapus",
        })
        await fetchPetugas()
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus petugas",
          variant: "destructive",
        })
      }
    }
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

        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Petugas
        </Button>
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

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kelompok Ronda:</span>
                  <span className="font-medium">{getKelompokRondaName((selectedPetugas as any).kelompokId)}</span>
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

      <PetugasForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={null}
        mode="create"
      />

      <PetugasForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPetugas}
        mode="edit"
      />
    </DashboardLayout>
  )
}
