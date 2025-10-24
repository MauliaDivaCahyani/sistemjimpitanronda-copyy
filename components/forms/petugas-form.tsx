"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Warga {
  id_warga: number
  nama_lengkap: string
}

interface Petugas {
  id?: number
  id_warga?: string
  namaLengkap: string
  username: string
  password: string
  jabatan: string
  jenisKelamin: string
  nomorHp: string
  alamat: string
  role: string
  createdAt?: string
  updatedAt?: string
}

interface PetugasFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Petugas, "id" | "createdAt" | "updatedAt">) => void
  initialData?: Petugas | null
  mode: "create" | "edit"
}

export function PetugasForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: PetugasFormProps) {
  const [formData, setFormData] = useState({
    id_warga: "",
    namaLengkap: "",
    username: "",
    password: "",
    jabatan: "",
    jenisKelamin: "",
    nomorHp: "",
    alamat: "",
    role: "petugas",
  })

  const [wargaList, setWargaList] = useState<Warga[]>([])

  // 🔹 Ambil data warga dari backend
  useEffect(() => {
    const fetchWarga = async () => {
      try {
        const res = await fetch("http://localhost:5006/api/warga")
        const data = await res.json()
        if (data.success) setWargaList(data.data)
      } catch (error) {
        console.error("Gagal memuat data warga:", error)
      }
    }
    fetchWarga()
  }, [])

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        id_warga: initialData.id_warga || "",
        namaLengkap: initialData.namaLengkap,
        username: initialData.username,
        password: "",
        jabatan: initialData.jabatan,
        jenisKelamin: initialData.jenisKelamin,
        nomorHp: initialData.nomorHp,
        alamat: initialData.alamat,
        role: initialData.role,
      })
    } else {
      setFormData({
        id_warga: "",
        namaLengkap: "",
        username: "",
        password: "",
        jabatan: "",
        jenisKelamin: "",
        nomorHp: "",
        alamat: "",
        role: "petugas",
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Petugas Baru" : "Edit Data Petugas"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 🔽 Nama Lengkap (ambil dari tabel warga) */}
          <div className="space-y-2">
            <Label htmlFor="id_warga">Nama Lengkap</Label>
            <select
              id="id_warga"
              value={formData.id_warga}
              onChange={(e) => {
                const selected = wargaList.find(
                  (w) => w.id_warga.toString() === e.target.value
                )
                setFormData({
                  ...formData,
                  id_warga: e.target.value,
                  namaLengkap: selected ? selected.nama_lengkap : "",
                })
              }}
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">-- Pilih Nama Warga --</option>
              {wargaList.map((warga) => (
                <option key={warga.id_warga} value={warga.id_warga}>
                  {warga.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Masukkan username"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={
                mode === "edit"
                  ? "Kosongkan jika tidak ingin mengubah"
                  : "Masukkan password"
              }
              required={mode === "create"}
            />
          </div>

          {/* Jabatan */}
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={formData.jabatan}
              onChange={(e) =>
                setFormData({ ...formData, jabatan: e.target.value })
              }
              placeholder="Masukkan jabatan"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-2">
            <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
            <Input
              id="jenisKelamin"
              value={formData.jenisKelamin}
              onChange={(e) =>
                setFormData({ ...formData, jenisKelamin: e.target.value })
              }
              placeholder="Laki-laki / Perempuan"
            />
          </div>

          {/* Nomor HP */}
          <div className="space-y-2">
            <Label htmlFor="nomorHp">Nomor HP</Label>
            <Input
              id="nomorHp"
              value={formData.nomorHp}
              onChange={(e) =>
                setFormData({ ...formData, nomorHp: e.target.value })
              }
              placeholder="08xxxxxxxxxx"
            />
          </div>

          {/* Alamat */}
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              value={formData.alamat}
              onChange={(e) =>
                setFormData({ ...formData, alamat: e.target.value })
              }
              placeholder="Masukkan alamat lengkap"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {mode === "create" ? "Tambah" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
