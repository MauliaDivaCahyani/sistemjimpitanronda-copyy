"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Rumah, Warga } from "@/types/database"
import { getAllWarga, getRumahById } from "@/lib/database"

interface RumahFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Rumah, "id" | "createdAt" | "updatedAt">) => void
  initialData?: Rumah | null
  mode: "create" | "edit"
}

export function RumahForm({ isOpen, onClose, onSubmit, initialData, mode }: RumahFormProps) {
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [formData, setFormData] = useState({
    alamat: "",
    rt: "",
    rw: "",
    kodeBarcode: "",
    statusKepemilikan: "milik_sendiri" as "milik_sendiri" | "kontrakan",
    idKepalaKeluarga: "",
  })

  useEffect(() => {
    const fetchWarga = async () => {
      try {
        if (mode === "edit" && initialData?.id) {
          // Untuk mode edit, ambil detail rumah dengan daftar penghuni
          const rumahDetail = await getRumahById(initialData.id)
          
          // Convert penghuni data structure untuk kompatibilitas
          const penghuni = rumahDetail.penghuni?.map(p => ({
            id: p.idWarga,
            namaLengkap: p.namaLengkap,
            nik: p.nik,
            jenisKelamin: p.jenisKelamin,
            statusAktif: p.statusAktif,
            nomorHp: "",
            idRumah: initialData.id,
            createdAt: new Date(),
            updatedAt: new Date()
          })) || []
          
          setWargaList(penghuni)
        } else {
          // Untuk mode create, ambil semua warga aktif yang belum punya rumah
          const data = await getAllWarga()
          const aktif = Array.isArray(data) 
            ? data.filter((w) => w.statusAktif === "Aktif" && !w.idRumah) 
            : []
          setWargaList(aktif)
        }
      } catch (err) {
        console.error("Gagal memuat data warga:", err)
      }
    }
    
    if (isOpen) {
      fetchWarga()
    }
  }, [isOpen, mode, initialData])

  useEffect(() => {
    if (initialData && mode === "edit") {
      // Mapping status kepemilikan dari backend ke form
      let statusMapping: "milik_sendiri" | "kontrakan" = "milik_sendiri";
      if (initialData.statusKepemilikan) {
        if (initialData.statusKepemilikan.toLowerCase() === "kontrakan") {
          statusMapping = "kontrakan";
        } else {
          statusMapping = "milik_sendiri";
        }
      }
      
      setFormData({
        alamat: initialData.alamat,
        rt: initialData.rt,
        rw: initialData.rw,
        kodeBarcode: initialData.kodeBarcode,
        statusKepemilikan: statusMapping,
        idKepalaKeluarga: (initialData as any).idKepalaKeluarga?.toString() || "",
      })
    } else {
      // Generate automatic barcode for new house
      const generateBarcode = () => {
        const timestamp = Date.now().toString().slice(-6)
        return `RMH${timestamp}`
      }

      setFormData({
        alamat: "",
        rt: "",
        rw: "",
        kodeBarcode: generateBarcode(),
        statusKepemilikan: "milik_sendiri",
        idKepalaKeluarga: "",
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mapping status kepemilikan untuk backend
    const statusKepemilikanBackend = formData.statusKepemilikan === "milik_sendiri" ? "Milik Sendiri" : "Kontrakan";
    
    const payload = {
      alamat: formData.alamat,
      rt: formData.rt,
      rw: formData.rw,
      kodeBarcode: formData.kodeBarcode,
      statusKepemilikan: statusKepemilikanBackend,
      idKepalaKeluarga: formData.idKepalaKeluarga && formData.idKepalaKeluarga !== "none" && formData.idKepalaKeluarga !== "no-data" 
        ? Number(formData.idKepalaKeluarga) 
        : null,
    }

    onSubmit(payload as any)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Rumah Baru" : "Edit Data Rumah"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Masukkan alamat lengkap"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rt">RT</Label>
              <Input
                id="rt"
                value={formData.rt}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                placeholder="01"
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rw">RW</Label>
              <Input
                id="rw"
                value={formData.rw}
                onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                placeholder="01"
                maxLength={3}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idKepalaKeluarga">
              Kepala Keluarga
              {mode === "edit" && (
                <span className="text-sm text-muted-foreground ml-1">
                  (hanya dari anggota keluarga rumah ini)
                </span>
              )}
            </Label>
            <Select
              value={formData.idKepalaKeluarga}
              onValueChange={(value) => setFormData({ ...formData, idKepalaKeluarga: value })}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    mode === "edit" 
                      ? "Pilih dari anggota keluarga" 
                      : "Pilih kepala keluarga (opsional)"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {mode === "edit" && (
                  <SelectItem value="none">Tidak ada kepala keluarga</SelectItem>
                )}
                {wargaList.length > 0 ? (
                  wargaList.map((warga) => (
                    <SelectItem key={warga.id} value={warga.id}>
                      {warga.namaLengkap}
                      {mode === "edit" && initialData?.idKepalaKeluarga === warga.id && (
                        <span className="text-xs text-muted-foreground ml-2">(saat ini)</span>
                      )}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-data" disabled>
                    {mode === "edit" 
                      ? "Belum ada anggota keluarga di rumah ini" 
                      : "Tidak ada warga yang tersedia"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {mode === "edit" && wargaList.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tambahkan warga ke rumah ini terlebih dahulu untuk memilih kepala keluarga
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusKepemilikan">Status Kepemilikan</Label>
            <Select
              value={formData.statusKepemilikan}
              onValueChange={(value: any) => setFormData({ ...formData, statusKepemilikan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status kepemilikan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milik_sendiri">Milik Sendiri</SelectItem>
                <SelectItem value="kontrakan">Kontrakan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kodeBarcode">Kode Barcode</Label>
            <Input
              id="kodeBarcode"
              value={formData.kodeBarcode}
              onChange={(e) => setFormData({ ...formData, kodeBarcode: e.target.value })}
              placeholder="Kode barcode otomatis"
              required
            />
          </div>

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
