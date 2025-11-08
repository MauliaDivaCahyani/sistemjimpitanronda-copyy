import type { User, UserRole } from "@/types/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5006/api"

export const authenticateUser = async (
  identifier: string,
  password: string,
  loginType: "phone" | "username",
): Promise<User | null> => {
  try {
    console.log("[AUTH] Making login request to:", `${API_BASE_URL}/auth/login`)
    console.log("[AUTH] API_BASE_URL from env:", API_BASE_URL)
    console.log("[AUTH] Login type:", loginType)
    
    // Add timeout untuk prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
        loginType,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    console.log("[AUTH] Response status:", response.status)
    const data = await response.json()
    console.log("[AUTH] Response data:", data)

    if (!response.ok) {
      console.error("Login failed:", data.message)
      // Throw error dengan pesan dari backend
      throw new Error(data.message || "Login gagal")
    }

    if (data.success && data.data?.user) {
      // Store token in localStorage
      if (data.data.token) {
        localStorage.setItem("authToken", data.data.token)
      }
      
      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.data.user))
      
      return data.data.user
    }

    throw new Error("Data user tidak valid")
  } catch (error) {
    console.error("Authentication error:", error)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error("Koneksi timeout - Server tidak merespons")
      }
      // Re-throw error dengan pesan asli
      throw error
    }
    throw new Error("Terjadi kesalahan saat login")
  }
}

export const verifyToken = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem("authToken")
    
    if (!token) {
      return null
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      // Token invalid, remove from storage
      localStorage.removeItem("authToken")
      localStorage.removeItem("currentUser")
      return null
    }

    if (data.success && data.data?.user) {
      // Update user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.data.user))
      return data.data.user
    }

    return null
  } catch (error) {
    console.error("Token verification error:", error)
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
    return null
  }
}

export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken")
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
    }
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    // Always clear local storage
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
  }
}

export const getCurrentUser = (): User | null => {
  try {
    const userData = localStorage.getItem("currentUser")
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
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
