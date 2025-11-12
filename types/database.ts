export interface Rumah {
  id: string
  alamat: string
  rt: string
  rw: string
  kodeBarcode: string
  statusKepemilikan?: string
  idKepalaKeluarga?: string
  kepalaKeluarga?: string
  jumlahPenghuni?: number
  penghuni?: Array<{
    idWarga: string
    namaLengkap: string
    nik: string
    jenisKelamin: string
    statusAktif: string
  }>
  createdAt: Date
  updatedAt: Date
}

export interface Warga {
  id: string
  idRumah?: string
  namaLengkap: string
  nik: string
  nomorHp: string
  jenisKelamin: string
  statusAktif: "Aktif" | "Tidak Aktif"
  createdAt: Date
  updatedAt: Date
  alamatRumah?: string
  isKepalaKeluarga?: boolean
}

export interface User {
  id: string
  namaLengkap: string
  username?: string
  password: string
  role: "warga" | "petugas" | "admin" | "super_admin"
  statusUser: boolean
  nomorHp?: string
  alamat?: string
  jabatan?: string
  kelompokId?: string
  createdAt: Date
  updatedAt: Date
}

export interface KelompokRonda {
  id: string
  namaKelompok: string
  keteranganKelompok: string
  createdAt: Date
  updatedAt: Date
}

export interface JenisDana {
  id: string
  namaDana: string
  deskripsi: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaksi {
  id: number | string  // Backend returns number, frontend might use string
  id_warga: number | string
  id_jenis?: string
  id_jenis_dana?: number | string  // Backend uses this field name
  id_user: number | string
  tanggal_setor: Date | string  // Fixed typo: setor not selor
  waktu_input: Date | string
  nominal: number
  status_jimpitan: "lunas" | "belum_lunas"
  created_at?: Date | string
  updated_at?: Date | string
  createdAt?: Date
  updatedAt?: Date
  // Backend JOIN fields
  namaWarga?: string
  nikWarga?: string
  jenisDana?: string
  // Relations
  warga?: Warga
  petugas?: User
}

export interface Presensi {
  id: string
  id_user: string
  id_warga?: string // Tambahan untuk kompatibilitas dengan backend
  check_in: Date
  check_out?: Date | null
  tanggal: Date
  status: "hadir" | "izin" | "sakit" | "alpha"
  createdAt: Date
  updatedAt: Date
  user?: User
}

export interface Laporan {
  id: string
  periode: string
  dibuatTanggal: Date
  totalJimpitan: number
  totalRonda: number
  createdAt: Date
  updatedAt: Date
}

export interface Petugas {
  id: string
  id_warga?: string // Tambahkan id_warga untuk keperluan presensi
  kelompokId?: string // Tambahkan kelompokId
  namaLengkap: string
  nik: string
  namaKelompok?: string
  jadwalHari?: string // Tambahkan jadwalHari
  jabatan?: string
  role: string
  status: string
  username: string
  createdAt: Date
  updatedAt: Date
}
