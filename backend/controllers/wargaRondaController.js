// backend/controllers/wargaRondaController.js
import { pool } from "../config/database.js"

// Helper function untuk mengecek apakah kelompok ronda sesuai jadwal hari tertentu
function isScheduledForDate(jadwalHari, targetDate) {
  if (!jadwalHari) return false;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDay = days[targetDate.getDay()];
  const schedule = jadwalHari.toLowerCase();
  const targetDayLower = targetDay.toLowerCase();
  
  // Handle different schedule formats
  if (schedule.includes(' - ')) {
    // Format: "Senin - Rabu" atau "Kamis - Sabtu"
    const [startDay, endDay] = schedule.split(' - ').map(day => day.trim());
    
    const dayOrder = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const targetIndex = dayOrder.indexOf(targetDayLower);
    const startIndex = dayOrder.indexOf(startDay.toLowerCase());
    const endIndex = dayOrder.indexOf(endDay.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    // Handle wrap-around schedules (e.g., Sabtu - Senin)
    if (startIndex <= endIndex) {
      return targetIndex >= startIndex && targetIndex <= endIndex;
    } else {
      return targetIndex >= startIndex || targetIndex <= endIndex;
    }
  } else {
    // Single day format: "Sabtu", "Minggu", etc.
    return schedule === targetDayLower;
  }
}

// Get informasi kelompok ronda hari ini dan kemarin untuk warga
export const getKelompokRondaInfo = async (req, res) => {
  try {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    console.log('=== DEBUG WARGA RONDA INFO ===')
    console.log('Today date:', todayStr)
    console.log('Yesterday date:', yesterdayStr)

    // Helper function untuk mendapatkan kelompok yang memiliki data absensi
    const getGroupsWithAbsensi = async (dateStr) => {
      const [groups] = await pool.query(`
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
        INNER JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
        INNER JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
        GROUP BY kr.id_kelompok_ronda, kr.nama_kelompok, kr.jadwal_hari
        HAVING COUNT(pr.id_presensi) > 0
        ORDER BY kr.nama_kelompok
      `, [dateStr])
      
      return groups
    }

    // Helper function untuk mendapatkan detail anggota yang ada absensi
    const getGroupMembers = async (dateStr) => {
      const [members] = await pool.query(`
        SELECT DISTINCT
          kr.id_kelompok_ronda AS kelompokId,
          kr.nama_kelompok AS namaKelompok,
          w.nama_lengkap AS namaLengkap,
          p.jabatan,
          pr.status,
          pr.check_in,
          pr.check_out,
          pr.keterangan
        FROM kelompok_ronda kr
        INNER JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
        INNER JOIN warga w ON p.id_warga = w.id_warga
        INNER JOIN presensi pr ON p.id_warga = pr.id_warga AND DATE(pr.tanggal) = ?
        GROUP BY kr.id_kelompok_ronda, w.nama_lengkap, pr.status
        ORDER BY kr.nama_kelompok, w.nama_lengkap
      `, [dateStr])
      
      return members
    }

    // Ambil data absensi untuk hari ini dan kemarin
    const [todayGroups, yesterdayGroups, todayMembers, yesterdayMembers] = await Promise.all([
      getGroupsWithAbsensi(todayStr),
      getGroupsWithAbsensi(yesterdayStr),
      getGroupMembers(todayStr),
      getGroupMembers(yesterdayStr)
    ])

    console.log('Today groups with absensi:', todayGroups)
    console.log('Today members with absensi:', todayMembers.length, 'records')
    console.log('Yesterday groups with absensi:', yesterdayGroups)
    console.log('Yesterday members with absensi:', yesterdayMembers.length, 'records')

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