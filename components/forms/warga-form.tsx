"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getAllRumah, getAllKelompokRonda } from "@/lib/database"
import type { Warga, Rumah, KelompokRonda } from "@/types/database"

interface WargaFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Warga, "id" | "createdAt" | "updatedAt">) => void
  initialData?: Warga | null
  mode: "create" | "edit"
}

export function WargaForm({ isOpen, onClose, onSubmit, initialData, mode }: WargaFormProps) {
  const [rumahList, setRumahList] = useState<Rumah[]>([])
  const [kelompokRondaList, setKelompokRondaList] = useState<KelompokRonda[]>([])
  const [formData, setFormData] = useState({
    idRumah: "",
    idKelompokRonda: "",
    namaLengkap: "",
    nik: "",
    nomorHp: "",
    jenisKelamin: "",
    statusAktif: "Aktif" as "Aktif" | "Tidak Aktif",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rumahData = await getAllRumah()
        setRumahList(Array.isArray(rumahData) ? rumahData : [])
        const kelompokData = await getAllKelompokRonda()
        setKelompokRondaList(Array.isArray(kelompokData) ? kelompokData : [])
      } catch (error) {
        console.error("Gagal memuat data rumah:", error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        idRumah: initialData.idRumah ?? "",
        idKelompokRonda: (initialData as any).idKelompokRonda ?? "",
        namaLengkap: initialData.namaLengkap ?? "",
        nik: initialData.nik ?? "",
        nomorHp: initialData.nomorHp ?? "",
        jenisKelamin: initialData.jenisKelamin ?? "",
        statusAktif: initialData.statusAktif ?? "Aktif",
      })
    } else {
      setFormData({
        idRumah: "",
        idKelompokRonda: "",
        namaLengkap: "",
        nik: "",
        nomorHp: "",
        jenisKelamin: "",
        statusAktif: "Aktif" as "Aktif" | "Tidak Aktif",
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit(formData as any)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Warga Baru" : "Edit Data Warga"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Rumah */}
          <div className="space-y-2">
            <Label htmlFor="rumah">Rumah (Contoh: Jl. Merdeka No. 1)</Label>
            <Select value={formData.idRumah} onValueChange={(value) => setFormData({ ...formData, idRumah: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih rumah" />
              </SelectTrigger>
              <SelectContent>
                {rumahList.map((rumah) => (
                  <SelectItem key={rumah.id} value={rumah.id}>
                    {rumah.alamat} (RT {rumah.rt}/RW {rumah.rw})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelompokRonda">Kelompok Ronda (Contoh: Kelompok A)</Label>
            <Select
              value={formData.idKelompokRonda}
              onValueChange={(value) => setFormData({ ...formData, idKelompokRonda: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelompok ronda" />
              </SelectTrigger>
              <SelectContent>
                {kelompokRondaList.map((kelompok) => (
                  <SelectItem key={kelompok.id} value={kelompok.id}>
                    {kelompok.namaKelompok}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap (Contoh: Budi Santoso)</Label>
            <Input
              id="nama"
              value={formData.namaLengkap}
              onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* NIK */}
          <div className="space-y-2">
            <Label htmlFor="nik">NIK (Contoh: 3201234567890123)</Label>
            <Input
              id="nik"
              value={formData.nik}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              placeholder="Masukkan NIK (16 digit)"
              maxLength={16}
              required
            />
          </div>

          {/* Nomor HP */}
          <div className="space-y-2">
            <Label htmlFor="nomorHp">Nomor HP (Contoh: 081234567890)</Label>
            <Input
              id="nomorHp"
              value={formData.nomorHp}
              onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
              placeholder="Masukkan nomor HP"
              required
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-2">
            <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
            <Select
              value={formData.jenisKelamin}
              onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tombol Aksi */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{mode === "create" ? "Tambah" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
