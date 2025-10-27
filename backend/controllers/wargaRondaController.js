// backend/controllers/wargaRondaController.js
import { pool } from "../config/database.js"

// Get informasi kelompok ronda hari ini dan kemarin untuk warga
export const getKelompokRondaInfo = async (req, res) => {
  try {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Query untuk mendapatkan kelompok ronda hari ini dengan status partisipasi
    const [todayGroups] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS id,
        kr.nama_kelompok AS namaKelompok,
        kr.jadwal_hari AS jadwalHari,
        COUNT(DISTINCT p.id_petugas) AS totalAnggota,
        COUNT(DISTINCT CASE WHEN pr.status = 'Hadir' THEN pr.id_warga END) AS hadirCount,
        COUNT(DISTINCT CASE WHEN pr.status = 'Izin' THEN pr.id_warga END) AS izinCount,
        COUNT(DISTINCT CASE WHEN pr.status = 'Tidak Hadir' THEN pr.id_warga END) AS sakitCount,
        (COUNT(DISTINCT p.id_petugas) - COUNT(DISTINCT pr.id_warga)) AS alphaCount
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
      GROUP BY kr.id_kelompok_ronda, kr.nama_kelompok, kr.jadwal_hari
      ORDER BY kr.nama_kelompok
    `, [todayStr])

    // Query untuk mendapatkan kelompok ronda kemarin dengan status partisipasi
    const [yesterdayGroups] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS id,
        kr.nama_kelompok AS namaKelompok,
        kr.jadwal_hari AS jadwalHari,
        COUNT(DISTINCT p.id_petugas) AS totalAnggota,
        COUNT(DISTINCT CASE WHEN pr.status = 'Hadir' THEN pr.id_warga END) AS hadirCount,
        COUNT(DISTINCT CASE WHEN pr.status = 'Izin' THEN pr.id_warga END) AS izinCount,
        COUNT(DISTINCT CASE WHEN pr.status = 'Tidak Hadir' THEN pr.id_warga END) AS sakitCount,
        (COUNT(DISTINCT p.id_petugas) - COUNT(DISTINCT pr.id_warga)) AS alphaCount
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
      GROUP BY kr.id_kelompok_ronda, kr.nama_kelompok, kr.jadwal_hari
      ORDER BY kr.nama_kelompok
    `, [yesterdayStr])

    // Query untuk mendapatkan detail anggota kelompok hari ini
    const [todayMembers] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS kelompokId,
        kr.nama_kelompok AS namaKelompok,
        w.nama_lengkap AS namaLengkap,
        p.jabatan,
        COALESCE(pr.status, 'Alpha') AS status,
        pr.check_in,
        pr.check_out
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
      WHERE w.nama_lengkap IS NOT NULL
      ORDER BY kr.nama_kelompok, w.nama_lengkap
    `, [todayStr])

    // Query untuk mendapatkan detail anggota kelompok kemarin
    const [yesterdayMembers] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS kelompokId,
        kr.nama_kelompok AS namaKelompok,
        w.nama_lengkap AS namaLengkap,
        p.jabatan,
        COALESCE(pr.status, 'Alpha') AS status,
        pr.check_in,
        pr.check_out
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
      WHERE w.nama_lengkap IS NOT NULL
      ORDER BY kr.nama_kelompok, w.nama_lengkap
    `, [yesterdayStr])

    res.json({
      success: true,
      data: {
        today: {
          date: todayStr,
          groups: todayGroups,
          members: todayMembers
        },
        yesterday: {
          date: yesterdayStr,
          groups: yesterdayGroups,
          members: yesterdayMembers
        }
      }
    })
  } catch (error) {
    console.error("Error fetching kelompok ronda info:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil informasi kelompok ronda",
      error: error.message,
    })
  }
}

// Get detail partisipasi kelompok ronda berdasarkan tanggal
export const getPartisipasiKelompok = async (req, res) => {
  try {
    const { tanggal } = req.params
    
    if (!tanggal) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal wajib diisi"
      })
    }

    const [members] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS kelompokId,
        kr.nama_kelompok AS namaKelompok,
        w.nama_lengkap AS namaLengkap,
        p.jabatan,
        COALESCE(pr.status, 'Alpha') AS status,
        pr.check_in,
        pr.check_out,
        pr.keterangan
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
      WHERE w.nama_lengkap IS NOT NULL
      ORDER BY kr.nama_kelompok, w.nama_lengkap
    `, [tanggal])

    // Group by kelompok
    const groupedData = members.reduce((acc, member) => {
      const { kelompokId, namaKelompok, ...memberData } = member
      
      if (!acc[kelompokId]) {
        acc[kelompokId] = {
          id: kelompokId,
          namaKelompok,
          members: []
        }
      }
      
      acc[kelompokId].members.push(memberData)
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        tanggal,
        kelompok: Object.values(groupedData)
      }
    })
  } catch (error) {
    console.error("Error fetching partisipasi kelompok:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data partisipasi",
      error: error.message,
    })
  }
}