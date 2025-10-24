import type { Rumah, Warga, User, JenisDana, KelompokRonda, Transaksi, Presensi } from "@/types/database"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5006/api"

// Helper umum untuk request
async function apiRequest<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...options,
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`API error ${res.status}: ${errorText}`)
    }

    // parse JSON
    const payload = await res.json().catch(() => null)

    // Jika payload memiliki properti `data`, kembalikan payload.data
    if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
      return payload.data as T
    }

    // Kalau tidak ada `data`, kembalikan payload mentahnya (bisa jadi array atau object)
    return payload as T
  } catch (error) {
    console.error(`Failed to fetch ${API_BASE_URL}/${endpoint}:`, error)
    throw new Error(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ==================== RUMAH ==================== */
export async function getAllRumah(): Promise<Rumah[]> {
  return apiRequest<Rumah[]>("rumah")
}

export async function createRumah(data: Omit<Rumah, "id" | "createdAt" | "updatedAt">): Promise<Rumah | any> {
  return apiRequest<any>("rumah", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateRumah(id: string, data: Partial<Rumah>): Promise<Rumah | any> {
  return apiRequest<any>(`rumah/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function getRumahById(id: string): Promise<Rumah> {
  return apiRequest<Rumah>(`rumah/${id}`)
}

export async function deleteRumah(id: string): Promise<void> {
  await apiRequest(`rumah/${id}`, { method: "DELETE" })
}


/* ==================== WARGA ==================== */
export async function getAllWarga(): Promise<Warga[]> {
  return apiRequest<Warga[]>("warga")
}

export async function createWarga(data: Omit<Warga, "id" | "createdAt" | "updatedAt">): Promise<Warga | any> {
  return apiRequest<any>("warga", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateWarga(id: string, data: Partial<Warga>): Promise<Warga | any> {
  return apiRequest<any>(`warga/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteWarga(id: string): Promise<void> {
  await apiRequest(`warga/${id}`, { method: "DELETE" })
}

export async function getWargaByBarcode(barcode: string): Promise<Warga | null> {
  try {
    const warga = await apiRequest<Warga>(`warga/barcode/${barcode}`)
    return warga
  } catch (error) {
    console.error("Gagal mengambil data warga berdasarkan barcode:", error)
    return null
  }
}

/* ==================== PETUGAS ==================== */
export async function getAllPetugas(): Promise<User[]> {
  return apiRequest<User[]>("petugas")
}

export async function createPetugas(data: any) {
  return apiRequest("petugas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export async function updatePetugas(id: string, data: Partial<User>): Promise<any> {
  return apiRequest<any>(`petugas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deletePetugas(id: string): Promise<void> {
  await apiRequest(`petugas/${id}`, { method: "DELETE" })
}

/* ==================== JENIS DANA ==================== */
export async function getAllJenisDana(): Promise<JenisDana[]> {
  return apiRequest<JenisDana[]>("jenis-dana")
}

export async function createJenisDana(
  data: Omit<JenisDana, "id" | "createdAt" | "updatedAt">,
): Promise<JenisDana | any> {
  return apiRequest<any>("jenis-dana", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateJenisDana(id: string, data: Partial<JenisDana>): Promise<JenisDana | any> {
  return apiRequest<any>(`jenis-dana/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteJenisDana(id: string): Promise<void> {
  await apiRequest(`jenis-dana/${id}`, { method: "DELETE" })
}

/* ==================== KELOMPOK RONDA ==================== */
export async function getAnggotaByKelompokId(id: string) {
  return apiRequest<any>(`kelompok-ronda/${id}/anggota`)
}

export async function getAllKelompokRonda(): Promise<KelompokRonda[]> {
  return apiRequest<KelompokRonda[]>("kelompok-ronda")
}

export async function createKelompokRonda(
  data: Omit<KelompokRonda, "id" | "createdAt" | "updatedAt">,
): Promise<KelompokRonda | any> {
  return apiRequest<any>("kelompok-ronda", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateKelompokRonda(id: string, data: Partial<KelompokRonda>): Promise<KelompokRonda | any> {
  return apiRequest<any>(`kelompok-ronda/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteKelompokRonda(id: string): Promise<void> {
  await apiRequest(`kelompok-ronda/${id}`, { method: "DELETE" })
}

/* ==================== TRANSAKSI ==================== */
export async function getAllTransaksi(): Promise<Transaksi[]> {
  return apiRequest<Transaksi[]>("transaksi")
}

export async function createTransaksi(
  data: Omit<Transaksi, "id" | "createdAt" | "updatedAt">,
): Promise<Transaksi | any> {
  return apiRequest<any>("transaksi", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getTransaksiById(id: string): Promise<Transaksi> {
  return apiRequest<Transaksi>(`transaksi/${id}`)
}

export async function getTransaksiByWarga(id_warga: string): Promise<Transaksi[]> {
  return apiRequest<Transaksi[]>(`transaksi/warga/${id_warga}`)
}

/* ==================== PRESENSI ==================== */
export async function getAllPresensi(): Promise<Presensi[]> {
  return apiRequest<Presensi[]>("presensi")
}

// Alias agar tetap bisa pakai nama pendek
export const getWarga = getAllWarga
export const getJenisDana = getAllJenisDana
