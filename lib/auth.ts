import type { User, UserRole } from "@/types/auth"

// Mock data untuk demo
const mockUsers: User[] = [
  {
    id: "1",
    nama: "Ahmad Wijaya",
    role: "warga",
    nomorHp: "081234567890",
    kelompokRonda: "Kelompok A",
    isActive: true,
  },
  {
    id: "2",
    nama: "Siti Nurhaliza",
    role: "petugas",
    username: "petugas1",
    kelompokRonda: "Kelompok A",
    isActive: true,
  },
  {
    id: "3",
    nama: "Budi Santoso",
    role: "admin",
    username: "admin1",
    isActive: true,
  },
  {
    id: "4",
    nama: "Maya Sari",
    role: "super_admin",
    username: "superadmin",
    isActive: true,
  },
]

export const authenticateUser = async (
  identifier: string,
  password: string,
  loginType: "phone" | "username",
): Promise<User | null> => {
  // Simulasi delay API
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (loginType === "phone") {
    // Login untuk warga menggunakan nomor HP
    const user = mockUsers.find((u) => u.nomorHp === identifier && u.role === "warga")
    return user || null
  } else {
    // Login untuk petugas, admin, super admin menggunakan username
    const user = mockUsers.find((u) => u.username === identifier && u.role !== "warga")
    return user || null
  }
}

export const getRolePermissions = (role: UserRole) => {
  const permissions = {
    warga: ["view_profile", "view_transactions"],
    petugas: ["scan_barcode", "input_transaction", "view_attendance", "mark_attendance"],
    admin: ["manage_residents", "manage_officers", "generate_barcode", "view_reports", "manage_fund_types"],
    super_admin: ["all_permissions"],
  }

  return permissions[role] || []
}

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  if (route.startsWith("/scan-barcode") && userRole !== "petugas") {
    return false
  }

  const roleRoutes = {
    warga: ["/dashboard", "/profile", "/transaksi"],
    petugas: ["/dashboard", "/scan-barcode", "/input-transaksi", "/absensi"],
    admin: [
      "/dashboard",
      "/data-rumah",
      "/data-warga",
      "/data-petugas",
      "/jenis-dana",
      "/kelompok-ronda",
      "/transaksi-dana",
      "/laporan",
    ],
    super_admin: ["*"], // Akses ke semua route kecuali yang di-hard block di atas
  }

  const allowedRoutes = roleRoutes[userRole] || []
  return allowedRoutes.includes("*") || allowedRoutes.some((r) => route.startsWith(r))
}
