"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { QrCode, User, Coins, Search } from "lucide-react"
import { getAllWarga, getAllJenisDana } from "@/lib/database"
import type { Warga, JenisDana } from "@/types/database"
import { toast } from "@/hooks/use-toast"

interface ManualTransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

interface PetugasLogin {
  id: string
  name: string
  username: string
  role: string
  loginTime: string
}

export function ManualTransactionForm({ isOpen, onClose, onSubmit }: ManualTransactionFormProps) {
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [jenisDanaList, setJenisDanaList] = useState<JenisDana[]>([])
  const [filteredWarga, setFilteredWarga] = useState<Warga[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showWargaList, setShowWargaList] = useState(false)
  const [petugas, setPetugas] = useState<PetugasLogin | null>(null)
  const [step, setStep] = useState<"login" | "pilih-jenis" | "input-manual" | "scan-barcode">("login")
  const [selectedJenis, setSelectedJenis] = useState<JenisDana | null>(null)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [formData, setFormData] = useState({
    selectedWarga: "",
    nominal: "",
    tanggal: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (isOpen) {
      // Cek apakah sudah ada petugas yang login
      const petugasData = localStorage.getItem("petugasLogin")
      if (petugasData) {
        setPetugas(JSON.parse(petugasData))
        setStep("pilih-jenis")
        fetchData()
      } else {
        setStep("login")
      }
    } else {
      // Reset state saat dialog ditutup
      setStep("login")
      setSelectedJenis(null)
      setSearchTerm("")
      setShowWargaList(false)
      setFormData({
        selectedWarga: "",
        nominal: "",
        tanggal: new Date().toISOString().split("T")[0],
      })
    }
  }, [isOpen])

  useEffect(() => {
    // Filter warga berdasarkan pencarian
    if (searchTerm.trim() === "") {
      setFilteredWarga(wargaList)
    } else {
      const filtered = wargaList.filter(warga =>
        warga.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warga.nik.includes(searchTerm)
      )
      setFilteredWarga(filtered)
    }
  }, [searchTerm, wargaList])

  const fetchData = async () => {
    try {
      const [wargaData, jenisDanaData] = await Promise.all([
        getAllWarga(),
        getAllJenisDana(),
      ])
      const activeWarga = wargaData.filter((w: Warga) => w.statusAktif === "Aktif")
      const activeJenis = jenisDanaData.filter((j: JenisDana) => j.isActive)
      
      setWargaList(activeWarga)
      setFilteredWarga(activeWarga)
      setJenisDanaList(activeJenis)
    } catch (error) {
      console.error("Gagal memuat data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      })
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulasi login sederhana
    const validUsers = [
      { username: "petugas1", password: "123456", name: "Ahmad Petugas", id: "1" },
      { username: "petugas2", password: "123456", name: "Siti Petugas", id: "2" },
      { username: "admin", password: "admin123", name: "Admin Sistem", id: "3" }
    ]

    const user = validUsers.find(u => 
      u.username === loginData.username && u.password === loginData.password
    )

    if (user) {
      const petugasData = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: "petugas",
        loginTime: new Date().toISOString()
      }
      
      localStorage.setItem("petugasLogin", JSON.stringify(petugasData))
      setPetugas(petugasData)
      setStep("pilih-jenis")
      fetchData()
      
      toast({
        title: "Login Berhasil",
        description: `Selamat datang, ${user.name}`,
      })
    } else {
      toast({
        title: "Login Gagal",
        description: "Username atau password salah",
        variant: "destructive",
      })
    }
  }

  const handleSelectJenis = (jenis: JenisDana) => {
    setSelectedJenis(jenis)
    setStep("input-manual")
  }

  const handleScanBarcode = () => {
    setStep("scan-barcode")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.selectedWarga || !formData.nominal) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Semua field wajib diisi",
        variant: "destructive",
      })
      return
    }

    const nominal = parseInt(formData.nominal)
    
    if (isNaN(nominal) || nominal <= 0) {
      toast({
        title: "Nominal Tidak Valid",
        description: "Nominal harus berupa angka positif",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      id_warga: formData.selectedWarga,
      id_jenis_dana: selectedJenis!.id,
      id_user: petugas!.id,
      nominal: nominal,
      tanggal_setor: formData.tanggal,
      status_jimpitan: "lunas",
    })

    // Reset form
    setStep("login")
    setSelectedJenis(null)
    setFormData({
      selectedWarga: "",
      nominal: "",
      tanggal: new Date().toISOString().split("T")[0],
    })
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getSelectedWargaName = () => {
    const warga = wargaList.find(w => w.id === formData.selectedWarga)
    return warga ? warga.namaLengkap : ""
  }

  const renderContent = () => {
    switch (step) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-4">
              <User className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-gray-600">Login sebagai petugas untuk melakukan transaksi</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Masukkan username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Masukkan password"
                required
              />
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Demo: username: <code>petugas1</code>, password: <code>123456</code>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
              <Button type="submit">Login</Button>
            </DialogFooter>
          </form>
        )

      case "pilih-jenis":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Coins className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-gray-600">Pilih jenis dana untuk transaksi</p>
              <p className="text-xs text-gray-500 mt-1">Petugas: {petugas?.name}</p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {jenisDanaList.map((jenis) => (
                <div
                  key={jenis.id}
                  className="p-3 border rounded-lg cursor-pointer hover:border-primary/30 hover:bg-primary/10 transition-all"
                  onClick={() => handleSelectJenis(jenis)}
                >
                  <h3 className="font-medium">{jenis.namaDana}</h3>
                  <p className="text-sm text-gray-600">{jenis.deskripsi}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleScanBarcode} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("login")}>Kembali</Button>
            </DialogFooter>
          </div>
        )

      case "scan-barcode":
        return (
          <div className="space-y-4 text-center">
            <QrCode className="h-16 w-16 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium">Scan Barcode Rumah</h3>
            <p className="text-sm text-gray-600">
              Fitur scan barcode sedang dalam pengembangan.<br/>
              Silakan gunakan input manual untuk sementara.
            </p>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("pilih-jenis")}>Kembali</Button>
              <Button onClick={() => setStep("input-manual")}>Input Manual</Button>
            </DialogFooter>
          </div>
        )

      case "input-manual":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-medium">Jenis Dana:</span>
                <Badge>{selectedJenis?.namaDana}</Badge>
              </div>
              <p className="text-xs text-gray-500">Petugas: {petugas?.name}</p>
            </div>

            {/* Search dan Pilih Warga */}
            <div className="space-y-2">
              <Label htmlFor="search">Cari dan Pilih Warga</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  placeholder="Cari nama warga atau NIK..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowWargaList(true)
                  }}
                  onFocus={() => setShowWargaList(true)}
                  className="pl-10"
                />
              </div>
              
              {/* Display selected warga */}
              {formData.selectedWarga && !showWargaList && (
                <div className="p-3 border rounded-lg bg-primary/10 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {wargaList.find(w => w.id === formData.selectedWarga)?.namaLengkap}
                      </p>
                      <p className="text-xs text-gray-500">
                        NIK: {wargaList.find(w => w.id === formData.selectedWarga)?.nik}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, selectedWarga: "" })
                        setSearchTerm("")
                        setShowWargaList(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
              
              {/* List of filtered warga - show when searching or focused */}
              {showWargaList && !formData.selectedWarga && (
                <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                  {filteredWarga.length > 0 ? (
                    filteredWarga.map((warga) => (
                      <div
                        key={warga.id}
                        className="p-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, selectedWarga: warga.id })
                          setSearchTerm(warga.namaLengkap)
                          setShowWargaList(false)
                        }}
                      >
                        <p className="font-medium text-sm">{warga.namaLengkap}</p>
                        <p className="text-xs text-gray-500">NIK: {warga.nik}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Tidak ada warga ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nominal */}
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="Masukkan nominal (contoh: 5000)"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                min="1"
                required
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Setor</Label>
              <Input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>

            {/* Summary */}
            {formData.selectedWarga && formData.nominal && (
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Ringkasan Transaksi:</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Warga:</span> {getSelectedWargaName()}</p>
                    <p><span className="font-medium">Jenis Dana:</span> {selectedJenis?.namaDana}</p>
                    <p><span className="font-medium">Nominal:</span> {formatCurrency(parseInt(formData.nominal))}</p>
                    <p><span className="font-medium">Tanggal:</span> {new Date(formData.tanggal).toLocaleDateString('id-ID')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("pilih-jenis")}>Kembali</Button>
              <Button type="submit">Simpan Transaksi</Button>
            </DialogFooter>
          </form>
        )

      default:
        return null
    }
  }

  const getDialogTitle = () => {
    switch (step) {
      case "login": return "Login Petugas"
      case "pilih-jenis": return "Pilih Jenis Dana"
      case "scan-barcode": return "Scan Barcode"
      case "input-manual": return "Input Manual Transaksi"
      default: return "Transaksi Dana"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {step === "login" && "Masuk sebagai petugas untuk melakukan transaksi"}
            {step === "pilih-jenis" && "Pilih jenis dana untuk transaksi"}
            {step === "scan-barcode" && "Scan barcode rumah untuk input otomatis"}
            {step === "input-manual" && "Isi data transaksi secara manual"}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
