import type { Presensi } from "@/types/database"
import { createPresensi, updatePresensi, getTodayPresensi } from "@/lib/database"

// Mock attendance data (untuk fallback jika API tidak tersedia)
const mockPresensi: Presensi[] = [
  {
    id: "1",
    id_user: "2",
    check_in: new Date("2024-01-15T19:00:00"),
    check_out: new Date("2024-01-16T06:00:00"),
    tanggal: new Date("2024-01-15"),
    status: "hadir",
    createdAt: new Date("2024-01-15T19:00:00"),
    updatedAt: new Date("2024-01-16T06:00:00"),
  },
  {
    id: "2",
    id_user: "5",
    check_in: new Date("2024-01-15T19:30:00"),
    check_out: new Date("2024-01-16T06:30:00"),
    tanggal: new Date("2024-01-15"),
    status: "hadir",
    createdAt: new Date("2024-01-15T19:30:00"),
    updatedAt: new Date("2024-01-16T06:30:00"),
  },
  {
    id: "3",
    id_user: "2",
    check_in: new Date("2024-01-16T19:00:00"),
    check_out: null,
    tanggal: new Date("2024-01-16"),
    status: "hadir",
    createdAt: new Date("2024-01-16T19:00:00"),
    updatedAt: new Date("2024-01-16T19:00:00"),
  },
  {
    id: "4",
    id_user: "5",
    check_in: new Date("2024-01-16T19:15:00"),
    check_out: null,
    tanggal: new Date("2024-01-16"),
    status: "hadir",
    createdAt: new Date("2024-01-16T19:15:00"),
    updatedAt: new Date("2024-01-16T19:15:00"),
  },
]

export interface AttendanceFilter {
  startDate?: Date
  endDate?: Date
  id_user?: string
  status?: "hadir" | "izin" | "sakit" | "alpha"
}

export interface AttendanceSession {
  id: string
  tanggal: Date
  startTime: string
  endTime: string
  isActive: boolean
  totalPetugas: number
  hadirCount: number
}

export interface AttendanceSummary {
  totalHadir: number
  totalIzin: number
  totalSakit: number
  totalAlpha: number
  persentaseKehadiran: number
}

// Helper function to map frontend status to backend status
const mapStatusToBackend = (status: "hadir" | "izin" | "sakit" | "alpha"): string => {
  const statusMap = {
    hadir: "Hadir",
    izin: "Izin", 
    sakit: "Tidak Hadir", // Backend tidak ada enum "Sakit", map ke "Tidak Hadir"
    alpha: "Tidak Hadir", // Backend tidak ada enum "Alpha", map ke "Tidak Hadir"
  }
  return statusMap[status] || "Hadir"
}

// Get attendance records with filters
export const getPresensi = async (filter?: AttendanceFilter): Promise<Presensi[]> => {
  try {
    const todayPresensi = await getTodayPresensi()

    let filteredPresensi = [...todayPresensi]

    if (filter) {
      if (filter.startDate) {
        filteredPresensi = filteredPresensi.filter((p) => new Date(p.tanggal) >= filter.startDate!)
      }
      if (filter.endDate) {
        filteredPresensi = filteredPresensi.filter((p) => new Date(p.tanggal) <= filter.endDate!)
      }
      if (filter.id_user) {
        filteredPresensi = filteredPresensi.filter((p) => p.id_user === filter.id_user)
      }
      if (filter.status) {
        filteredPresensi = filteredPresensi.filter((p) => p.status === filter.status)
      }
    }

    return filteredPresensi.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  } catch (error) {
    console.error("Error fetching attendance from backend:", error)
    // Fallback to mock data
    let filteredPresensi = [...mockPresensi]

    if (filter) {
      if (filter.startDate) {
        filteredPresensi = filteredPresensi.filter((p) => p.tanggal >= filter.startDate!)
      }
      if (filter.endDate) {
        filteredPresensi = filteredPresensi.filter((p) => p.tanggal <= filter.endDate!)
      }
      if (filter.id_user) {
        filteredPresensi = filteredPresensi.filter((p) => p.id_user === filter.id_user)
      }
      if (filter.status) {
        filteredPresensi = filteredPresensi.filter((p) => p.status === filter.status)
      }
    }

    return filteredPresensi.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
  }
}

// Get attendance summary
export const getAttendanceSummary = async (filter?: AttendanceFilter): Promise<AttendanceSummary> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const presensi = await getPresensi(filter)

  const totalHadir = presensi.filter((p) => p.status === "hadir").length
  const totalIzin = presensi.filter((p) => p.status === "izin").length
  const totalSakit = presensi.filter((p) => p.status === "sakit").length
  const totalAlpha = presensi.filter((p) => p.status === "alpha").length

  const totalRecords = presensi.length
  const persentaseKehadiran = totalRecords > 0 ? (totalHadir / totalRecords) * 100 : 0

  return {
    totalHadir,
    totalIzin,
    totalSakit,
    totalAlpha,
    persentaseKehadiran,
  }
}

// Check if user already has attendance for today
export const getTodayAttendance = async (id_user: string): Promise<Presensi | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendance = mockPresensi.find((p) => {
    const attendanceDate = new Date(p.tanggal)
    attendanceDate.setHours(0, 0, 0, 0)
    return p.id_user === id_user && attendanceDate.getTime() === today.getTime()
  })

  return attendance || null
}

// Check in attendance
export const checkInAttendance = async (id_user: string): Promise<Presensi> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const today = new Date()
  const existingAttendance = await getTodayAttendance(id_user)

  if (existingAttendance) {
    throw new Error("Anda sudah melakukan check-in hari ini")
  }

  const newAttendance: Presensi = {
    id: (mockPresensi.length + 1).toString(),
    id_user,
    check_in: new Date(),
    check_out: null,
    tanggal: today,
    status: "hadir",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  mockPresensi.push(newAttendance)
  return newAttendance
}

// Check out attendance
export const checkOutAttendance = async (id_user: string): Promise<Presensi> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const todayAttendance = await getTodayAttendance(id_user)

  if (!todayAttendance) {
    throw new Error("Anda belum melakukan check-in hari ini")
  }

  if (todayAttendance.check_out) {
    throw new Error("Anda sudah melakukan check-out hari ini")
  }

  const index = mockPresensi.findIndex((p) => p.id === todayAttendance.id)
  if (index !== -1) {
    mockPresensi[index] = {
      ...mockPresensi[index],
      check_out: new Date(),
      updatedAt: new Date(),
    }
    return mockPresensi[index]
  }

  throw new Error("Gagal melakukan check-out")
}

// Mark attendance for other users (by PIC)
export const markAttendance = async (
  id_user: string,
  status: "hadir" | "izin" | "sakit" | "alpha",
  markedBy: string,
  checkInTime?: Date,
): Promise<Presensi> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  try {
    console.log(`markAttendance called: id_user=${id_user}, status=${status}`)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Format tanggal untuk database (YYYY-MM-DD)
    const tanggalStr = today.toISOString().split('T')[0]
    
    console.log(`Mapped status: ${status} -> ${mapStatusToBackend(status)}`)

    // Try to get existing attendance from backend
    const todayPresensi = await getTodayPresensi()
    const existingAttendance = todayPresensi.find((p) => p.id_user === id_user)

    if (existingAttendance) {
      // Update existing attendance
      const updated = await updatePresensi(existingAttendance.id, {
        id_warga: id_user, // Backend mengharapkan id_warga
        tanggal: tanggalStr, // Format tanggal yang benar
        status: mapStatusToBackend(status), // Map status ke format backend
        check_in: checkInTime || existingAttendance.check_in,
      })
      return updated
    }

    // Create new attendance record
    const newAttendance = await createPresensi({
      id_warga: id_user, // Backend mengharapkan id_warga bukan id_user
      check_in: checkInTime || new Date(),
      check_out: null,
      tanggal: tanggalStr, // Kirim tanggal dalam format string YYYY-MM-DD
      status: mapStatusToBackend(status), // Map status ke format backend
    })

    return newAttendance

  } catch (error) {
    console.error("Error saving attendance to backend:", error)
    // Fallback to mock data if API fails
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingAttendance = mockPresensi.find((p) => {
      const attendanceDate = new Date(p.tanggal)
      attendanceDate.setHours(0, 0, 0, 0)
      return p.id_user === id_user && attendanceDate.getTime() === today.getTime()
    })

    if (existingAttendance) {
      const index = mockPresensi.findIndex((p) => p.id === existingAttendance.id)
      if (index !== -1) {
        mockPresensi[index] = {
          ...mockPresensi[index],
          status,
          check_in: checkInTime || mockPresensi[index].check_in,
          updatedAt: new Date(),
        }
        return mockPresensi[index]
      }
    }

    const newAttendance: Presensi = {
      id: (mockPresensi.length + 1).toString(),
      id_user,
      check_in: checkInTime || new Date(),
      check_out: null,
      tanggal: today,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPresensi.push(newAttendance)
    return newAttendance
  }
}

// Get current active session
export const getCurrentSession = async (): Promise<AttendanceSession | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const today = new Date()
  const currentHour = today.getHours()

  // Define session times (19:00 - 06:00 next day)
  const isActiveSession = currentHour >= 19 || currentHour < 6

  if (!isActiveSession) {
    return null
  }

  const todayAttendance = mockPresensi.filter((p) => {
    const attendanceDate = new Date(p.tanggal)
    attendanceDate.setHours(0, 0, 0, 0)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    return attendanceDate.getTime() === todayDate.getTime()
  })

  return {
    id: "session-1",
    tanggal: today,
    startTime: "19:00",
    endTime: "06:00",
    isActive: true,
    totalPetugas: 10, // Mock total officers
    hadirCount: todayAttendance.filter((p) => p.status === "hadir").length,
  }
}

// Get attendance statistics for a date range
export const getAttendanceStats = async (startDate: Date, endDate: Date) => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const filter: AttendanceFilter = { startDate, endDate }
  const presensi = await getPresensi(filter)

  // Group by date
  const statsByDate = presensi.reduce(
    (acc, p) => {
      const dateKey = p.tanggal.toISOString().split("T")[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 }
      }
      acc[dateKey][p.status]++
      acc[dateKey].total++
      return acc
    },
    {} as Record<string, { hadir: number; izin: number; sakit: number; alpha: number; total: number }>,
  )

  return statsByDate
}
