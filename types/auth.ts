export type UserRole = "warga" | "petugas" | "admin" | "super_admin"

export interface User {
  id: string
  nama: string
  role: UserRole
  username?: string
  nomorHp?: string
  kelompokRonda?: string
  isActive: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
