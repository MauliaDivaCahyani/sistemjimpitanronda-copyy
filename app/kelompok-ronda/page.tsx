"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Users, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import {
  getAllKelompokRonda,
  createKelompokRonda,
  updateKelompokRonda,
  deleteKelompokRonda,
  getAllPetugas,
} from "@/lib/database"
import type { KelompokRonda, User } from "@/types/database"

const mockMembers: Record<string, string[]> = {
  default: [
    "Budi Santoso",
    "Ahmad Hidayat",
    "Siti Nurhaliza",
    "Joko Widodo",
    "Rina Susanti",
    "Agus Setiawan",
    "Dewi Lestari",
    "Hendra Gunawan",
  ],
}

export default function KelompokRondaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedKelompok, setSelectedKelompok] = useState<KelompokRonda | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({})
  const [petugasList, setPetugasList] = useState<User[]>([])
  const [formData, setFormData] = useState({
    namaKelompok: "",
    keteranganKelompok: "",
  })

  // ✅ FIX: Ambil data async dengan useEffect
  const [kelompokRonda, setKelompokRonda] = useState<KelompokRonda[]>([])

  useEffect(() => {
    async function fetchKelompokRonda() {
      try {
        const data = await getAllKelompokRonda()
        // ✅ Langsung set, karena lib/database.ts sudah mengembalikan array
        setKelompokRonda(Array.isArray(data) ? data : [])
        const petugasData = await getAllPetugas()
        setPetugasList(Array.isArray(petugasData) ? petugasData : [])
      } catch (error) {
        console.error("Gagal memuat data kelompok ronda:", error)
        setKelompokRonda([])
      }
    }
    fetchKelompokRonda()
  }, [])

  const filteredKelompok = kelompokRonda.filter(
    (k) =>
      k.namaKelompok.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keteranganKelompok.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAdd = async () => {
    await createKelompokRonda(formData)
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (kelompok: KelompokRonda) => {
    setSelectedKelompok(kelompok)
    setFormData({
      namaKelompok: kelompok.namaKelompok,
      keteranganKelompok: kelompok.keteranganKelompok,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (selectedKelompok) {
      await updateKelompokRonda(selectedKelompok.id, formData)
      setIsEditDialogOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelompok ronda ini?")) {
      await deleteKelompokRonda(id)
    }
  }

  const resetForm = () => {
    setFormData({
      namaKelompok: "",
      keteranganKelompok: "",
    })
    setSelectedKelompok(null)
  }

  const getMembers = (kelompokId: string, kelompokName: string) => {
    const petugasInKelompok = petugasList.filter((p) => (p as any).idKelompokRonda === kelompokId)
    return petugasInKelompok.length > 0 ? petugasInKelompok.map((p) => p.namaLengkap || p.username || "Unknown") : []
  }

  const toggleMemberExpansion = (kelompokId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [kelompokId]: !prev[kelompokId],
    }))
  }

  return (
    <DashboardLayout title="Kelompok Ronda">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari kelompok ronda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 md:w-80"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelompok
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Kelompok Ronda Baru</DialogTitle>
              <DialogDescription>Masukkan informasi kelompok ronda baru (Contoh: Kelompok A)</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="namaKelompok" className="sm:text-right">
                  Nama Kelompok
                </Label>
                <Input
                  id="namaKelompok"
                  value={formData.namaKelompok}
                  onChange={(e) => setFormData({ ...formData, namaKelompok: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="Contoh: Kelompok A"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="keteranganKelompok" className="sm:text-right">
                  Keterangan
                </Label>
                <Textarea
                  id="keteranganKelompok"
                  value={formData.keteranganKelompok}
                  onChange={(e) => setFormData({ ...formData, keteranganKelompok: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="Deskripsi kelompok ronda..."
                />
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
          <CardTitle>Daftar Kelompok Ronda</CardTitle>
          <CardDescription>Total {filteredKelompok.length} kelompok ronda terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKelompok.map((kelompok) => {
              const members = getMembers(kelompok.id, kelompok.namaKelompok)
              const isExpanded = expandedMembers[kelompok.id]

              return (
                <div key={kelompok.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{kelompok.namaKelompok}</h3>
                      <p className="text-sm text-gray-600 mb-2">{kelompok.keteranganKelompok}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => toggleMemberExpansion(kelompok.id)}
                      className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{members.length} Anggota</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1 bg-gray-50 rounded-md p-3">
                        {members.length > 0 ? (
                          members.map((member, index) => (
                            <div key={index} className="text-sm text-gray-700 flex items-center">
                              <span className="w-6 text-gray-400">{index + 1}.</span>
                              <span>{member}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic">Belum ada anggota</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Jadwal: {kelompok.jadwalHari || "-"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Area: RT 01-03</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleEdit(kelompok)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => handleDelete(kelompok.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Kelompok Ronda</DialogTitle>
            <DialogDescription>Ubah informasi kelompok ronda</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_namaKelompok" className="sm:text-right">
                Nama Kelompok
              </Label>
              <Input
                id="edit_namaKelompok"
                value={formData.namaKelompok}
                onChange={(e) => setFormData({ ...formData, namaKelompok: e.target.value })}
                className="sm:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_keteranganKelompok" className="sm:text-right">
                Keterangan
              </Label>
              <Textarea
                id="edit_keteranganKelompok"
                value={formData.keteranganKelompok}
                onChange={(e) => setFormData({ ...formData, keteranganKelompok: e.target.value })}
                className="sm:col-span-3"
              />
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
