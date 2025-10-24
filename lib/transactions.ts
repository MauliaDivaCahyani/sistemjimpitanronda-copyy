import type { Transaksi } from "@/types/database"

// Mock transaction data
const mockTransaksi: Transaksi[] = [
  {
    id: "1",
    id_warga: "1",
    id_jenis: "1",
    id_user: "2",
    tanggal_selor: new Date("2024-01-15"),
    waktu_input: new Date("2024-01-15T19:30:00"),
    nominal: 1000,
    status_jimpitan: "lunas",
    createdAt: new Date("2024-01-15T19:30:00"),
    updatedAt: new Date("2024-01-15T19:30:00"),
  },
  {
    id: "2",
    id_warga: "2",
    id_jenis: "1",
    id_user: "2",
    tanggal_selor: new Date("2024-01-15"),
    waktu_input: new Date("2024-01-15T19:35:00"),
    nominal: 1000,
    status_jimpitan: "lunas",
    createdAt: new Date("2024-01-15T19:35:00"),
    updatedAt: new Date("2024-01-15T19:35:00"),
  },
  {
    id: "3",
    id_warga: "3",
    id_jenis: "2",
    id_user: "5",
    tanggal_selor: new Date("2024-01-15"),
    waktu_input: new Date("2024-01-15T20:00:00"),
    nominal: 5000,
    status_jimpitan: "lunas",
    createdAt: new Date("2024-01-15T20:00:00"),
    updatedAt: new Date("2024-01-15T20:00:00"),
  },
  {
    id: "4",
    id_warga: "1",
    id_jenis: "3",
    id_user: "2",
    tanggal_selor: new Date("2024-01-16"),
    waktu_input: new Date("2024-01-16T19:15:00"),
    nominal: 10000,
    status_jimpitan: "lunas",
    createdAt: new Date("2024-01-16T19:15:00"),
    updatedAt: new Date("2024-01-16T19:15:00"),
  },
  {
    id: "5",
    id_warga: "4",
    id_jenis: "1",
    id_user: "2",
    tanggal_selor: new Date("2024-01-16"),
    waktu_input: new Date("2024-01-16T19:45:00"),
    nominal: 1000,
    status_jimpitan: "lunas",
    createdAt: new Date("2024-01-16T19:45:00"),
    updatedAt: new Date("2024-01-16T19:45:00"),
  },
]

export interface TransactionFilter {
  startDate?: Date
  endDate?: Date
  id_warga?: string
  id_jenis?: string
  status_jimpitan?: "lunas" | "belum_lunas" | "all"   // ✅ tambahin "all"
}

export interface TransactionSummary {
  totalTransaksi: number
  totalNominal: number
  totalHariIni: number
  totalBulanIni: number
  rataRataHarian: number
}

// Get transactions with filters
export const getTransaksi = async (filter?: TransactionFilter): Promise<Transaksi[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  let filteredTransaksi = [...mockTransaksi]

  if (filter) {
    if (filter.startDate) {
      filteredTransaksi = filteredTransaksi.filter((t) => t.tanggal_selor >= filter.startDate!)
    }
    if (filter.endDate) {
      filteredTransaksi = filteredTransaksi.filter((t) => t.tanggal_selor <= filter.endDate!)
    }
    if (filter.id_warga) {
      filteredTransaksi = filteredTransaksi.filter((t) => t.id_warga === filter.id_warga)
    }
    if (filter.id_jenis) {
      filteredTransaksi = filteredTransaksi.filter((t) => t.id_jenis === filter.id_jenis)
    }
    if (filter.status_jimpitan && filter.status_jimpitan !== "all") {   // ✅ handle "all"
      filteredTransaksi = filteredTransaksi.filter(
        (t) => t.status_jimpitan === filter.status_jimpitan
      )
    }
  }

  return filteredTransaksi.sort((a, b) => b.waktu_input.getTime() - a.waktu_input.getTime())
}

// Get transaction summary
export const getTransactionSummary = async (filter?: TransactionFilter): Promise<TransactionSummary> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const transaksi = await getTransaksi(filter)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const totalTransaksi = transaksi.length
  const totalNominal = transaksi.reduce((sum, t) => sum + t.nominal, 0)

  const transaksiHariIni = transaksi.filter((t) => t.tanggal_selor.toDateString() === today.toDateString())
  const totalHariIni = transaksiHariIni.reduce((sum, t) => sum + t.nominal, 0)

  const transaksiBulanIni = transaksi.filter((t) => t.tanggal_selor >= startOfMonth)
  const totalBulanIni = transaksiBulanIni.reduce((sum, t) => sum + t.nominal, 0)

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const rataRataHarian = totalBulanIni / daysInMonth

  return {
    totalTransaksi,
    totalNominal,
    totalHariIni,
    totalBulanIni,
    rataRataHarian,
  }
}

// Create new transaction
export const createTransaksi = async (data: Omit<Transaksi, "id" | "createdAt" | "updatedAt">): Promise<Transaksi> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const newTransaksi: Transaksi = {
    ...data,
    id: (mockTransaksi.length + 1).toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  mockTransaksi.push(newTransaksi)
  return newTransaksi
}

// Update transaction
export const updateTransaksi = async (id: string, data: Partial<Transaksi>): Promise<Transaksi | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const index = mockTransaksi.findIndex((t) => t.id === id)
  if (index === -1) return null

  mockTransaksi[index] = { ...mockTransaksi[index], ...data, updatedAt: new Date() }
  return mockTransaksi[index]
}

// Delete transaction
export const deleteTransaksi = async (id: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const index = mockTransaksi.findIndex((t) => t.id === id)
  if (index === -1) return false

  mockTransaksi.splice(index, 1)
  return true
}

// Get transactions by warga (for warga dashboard)
export const getTransaksiByWarga = async (id_warga: string): Promise<Transaksi[]> => {
  const filter: TransactionFilter = { id_warga }
  return getTransaksi(filter)
}

// Get recent transactions (last 30 days)
export const getRecentTransaksi = async (): Promise<Transaksi[]> => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const filter: TransactionFilter = { startDate: thirtyDaysAgo }
  return getTransaksi(filter)
}
