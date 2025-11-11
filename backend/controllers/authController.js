// backend/controllers/authController.js
import { pool } from "../config/database.js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

// Login function for both username and phone number
export const login = async (req, res) => {
  try {
    const { identifier, password, loginType } = req.body

    console.log("[AUTH] Login attempt:", { identifier, loginType })

    if (!identifier || !password || !loginType) {
      return res.status(400).json({
        success: false,
        message: "Identifier, password, dan loginType wajib diisi"
      })
    }

    let user = null
    let userQuery = ""
    let userParams = []

    if (loginType === "phone") {
      // Login for Warga using phone number
      userQuery = `
        SELECT w.id_warga as id, w.nama_lengkap as nama, w.nomor_hp as nomorHp, 
               'warga' as role, w.status_aktif as status,
               w.nomor_hp as identifier_field, w.password_custom,
               w.email, w.alamat
        FROM warga w 
        WHERE w.nomor_hp = ? AND w.status_aktif = 'Aktif'
      `
      userParams = [identifier]
    } else if (loginType === "username") {
      // Login for Petugas, Admin, Super Admin using username
      userQuery = `
        SELECT p.id_petugas as id, p.username, p.password as stored_password,
               p.role, p.status, p.jabatan,
               p.username as identifier_field,
               p.username as nama
        FROM petugas p
        WHERE p.username = ? AND p.status = 'Aktif'
      `
      userParams = [identifier]
    } else {
      return res.status(400).json({
        success: false,
        message: "Login type tidak valid"
      })
    }

    const [rows] = await pool.query(userQuery, userParams)

    if (rows.length === 0) {
      console.log("[AUTH] User not found:", identifier)
      return res.status(401).json({
        success: false,
        message: loginType === "phone" ? "Nomor HP tidak ditemukan atau tidak aktif" : "Username tidak ditemukan atau tidak aktif"
      })
    }

    user = rows[0]
    console.log("[AUTH] User found:", { 
      id: user.id, 
      nama: user.nama, 
      role_db: user.role,
      jabatan: user.jabatan
    })

    // Password verification
    let isPasswordValid = false

    if (loginType === "phone") {
      // For warga, check password_custom first, if null use default "1234"
      const wargaPassword = user.password_custom || "1234"
      isPasswordValid = password === wargaPassword
      console.log("[AUTH] Warga password check:", { hasCustomPassword: !!user.password_custom })
    } else {
      // For petugas/admin/superadmin, compare with stored password
      if (user.stored_password) {
        // Simple text comparison for now (in production, use bcrypt)
        isPasswordValid = password === user.stored_password
      }
    }

    if (!isPasswordValid) {
      console.log("[AUTH] Invalid password for user:", identifier)
      return res.status(401).json({
        success: false,
        message: "Password salah"
      })
    }

    // Generate JWT token - FIX: Normalize role to lowercase
    const finalRole = (user.role || "petugas").toLowerCase()

    const tokenPayload = {
      id: user.id,
      nama: user.nama,
      role: finalRole,  // Now it's 'admin' instead of 'Admin'
      identifier: user.identifier_field
    }

    if (user.kelompokRonda) {
      tokenPayload.kelompokRonda = user.kelompokRonda
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    console.log("[AUTH] Login successful for:", user.nama)

    // Return user data and token
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          id: user.id.toString(),
          nama: user.nama,
          role: finalRole,
          username: user.username || undefined,
          nomorHp: user.nomorHp || undefined,
          email: user.email || undefined,
          alamat: user.alamat || undefined,
          kelompokRonda: user.kelompokRonda || undefined,
          isActive: true
        },
        token
      }
    })

  } catch (error) {
    console.error("[AUTH] Login error:", error)
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message
    })
  }
}

// Verify JWT token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan"
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Optionally verify user still exists and is active
    let userExists = false
    if (decoded.role === "warga") {
      const [rows] = await pool.query(
        "SELECT id_warga FROM warga WHERE id_warga = ? AND status_aktif = 'Aktif'",
        [decoded.id]
      )
      userExists = rows.length > 0
    } else {
      const [rows] = await pool.query(
        "SELECT id_petugas FROM petugas WHERE id_petugas = ? AND status = 'Aktif'",
        [decoded.id]
      )
      userExists = rows.length > 0
    }

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan atau tidak aktif"
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: decoded.id.toString(),
          nama: decoded.nama,
          role: decoded.role,
          username: decoded.username || undefined,
          nomorHp: decoded.nomorHp || undefined,
          kelompokRonda: decoded.kelompokRonda || undefined,
          isActive: true
        }
      }
    })

  } catch (error) {
    console.error("[AUTH] Token verification error:", error)
    res.status(401).json({
      success: false,
      message: "Token tidak valid"
    })
  }
}

// Logout
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    res.json({
      success: true,
      message: "Logout berhasil"
    })
  } catch (error) {
    console.error("[AUTH] Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat logout"
    })
  }
}
