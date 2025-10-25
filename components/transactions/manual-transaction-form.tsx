"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getAllRumah, getAllWarga, getAllJenisDana } from "@/lib/database"
import type { Rumah, Warga, JenisDana } from "@/types/database"
import { toast } from "@/hooks/use-toast"

interface ManualTransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ManualTransactionForm({ isOpen, onClose, onSubmit }: ManualTransactionFormProps) {
  const [rumahList, setRumahList] = useState<Rumah[]>([])
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [jenisDanaList, setJenisDanaList] = useState<JenisDana[]>([])
  const [selectedRumah, setSelectedRumah] = useState<string>("")
  const [selectedWarga, setSelectedWarga] = useState<string>("")
  const [formData, setFormData] = useState({
    nominal: "",
    jenisDana: "",
    tanggal: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rumahData, wargaData, jenisDanaData] = await Promise.all([
          getAllRumah(),
          getAllWarga(),
          getAllJenisDana(),
        ])
        setRumahList(Array.isArray(rumahData) ? rumahData : [])
        setWargaList(Array.isArray(wargaData) ? wargaData : [])
        setJenisDanaList(Array.isArray(jenisDanaData) ? jenisDanaData : [])
      } catch (error) {
        console.error("Gagal memuat data:", error)
        toast({
          title: "Error",
          description: "Gagal memuat data rumah dan warga",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleRumahChange = (rumahId: string) => {
    setSelectedRumah(rumahId)
    // Filter warga berdasarkan rumah yang dipilih
    const wargaInRumah = wargaList.filter((w) => w.idRumah === rumahId)
    if (wargaInRumah.length > 0) {
      setSelectedWarga(wargaInRumah[0].id)
    } else {
      setSelectedWarga("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedWarga) {
      toast({
        title: "Error",
        description: "Silakan pilih warga terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    if (!formData.jenisDana) {
      toast({
        title: "Error",
        description: "Silakan pilih jenis dana",
        variant: "destructive",
      })
      return
    }

    if (!formData.nominal || Number.parseFloat(formData.nominal) <= 0) {
      toast({
        title: "Error",
        description: "Nominal harus lebih dari 0",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      id_warga: selectedWarga,
      id_jenis: formData.jenisDana,
      nominal: Number.parseFloat(formData.nominal),
      tanggal_selor: new Date(formData.tanggal),
      status_jimpitan: "lunas",
    })

    // Reset form
    setSelectedRumah("")
    setSelectedWarga("")
    setFormData({
      nominal: "",
      jenisDana: "",
      tanggal: new Date().toISOString().split("T")[0],
    })
    onClose()
  }

  const wargaInSelectedRumah = selectedRumah ? wargaList.filter((w) => w.idRumah === selectedRumah) : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Input Transaksi Manual</DialogTitle>
          <DialogDescription>Tambahkan transaksi dana secara manual</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Rumah */}
          <div className="space-y-2">
            <Label htmlFor="rumah">Rumah</Label>
            <Select value={selectedRumah} onValueChange={handleRumahChange}>
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

          {/* Pilihan Warga */}
          <div className="space-y-2">
            <Label htmlFor="warga">Warga</Label>
            <Select value={selectedWarga} onValueChange={setSelectedWarga}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih warga" />
              </SelectTrigger>
              <SelectContent>
                {wargaInSelectedRumah.map((warga) => (
                  <SelectItem key={warga.id} value={warga.id}>
                    {warga.namaLengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jenis Dana */}
          <div className="space-y-2">
            <Label htmlFor="jenisDana">Jenis Dana</Label>
            <Select
              value={formData.jenisDana}
              onValueChange={(value) => setFormData({ ...formData, jenisDana: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis dana" />
              </SelectTrigger>
              <SelectContent>
                {jenisDanaList.map((jenis) => (
                  <SelectItem key={jenis.id} value={jenis.id}>
                    {jenis.namaDana}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nominal */}
          <div className="space-y-2">
            <Label htmlFor="nominal">Nominal (Rp)</Label>
            <Input
              id="nominal"
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              placeholder="Masukkan nominal"
              min="0"
              required
            />
          </div>

          {/* Tanggal */}
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal Transaksi</Label>
            <Input
              id="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">Simpan Transaksi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
