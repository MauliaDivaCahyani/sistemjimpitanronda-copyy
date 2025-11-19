import { pool } from "../config/database.js"

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log("[DASHBOARD] Fetching dashboard statistics")

    // Get total warga aktif
    const [wargaRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM warga 
      WHERE status_aktif = 'Aktif'
    `)
    const totalWarga = wargaRows[0].total

    // Get total rumah
    const [rumahRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM rumah
    `)
    const totalRumah = rumahRows[0].total

    // Get dana hari ini
    const today = new Date().toISOString().split('T')[0]
    const [danaHariIniRows] = await pool.query(`
      SELECT COALESCE(SUM(nominal), 0) as total 
      FROM transaksi 
      WHERE DATE(tanggal_setor) = ?
    `, [today])
    const totalDanaHariIni = parseFloat(danaHariIniRows[0].total) || 0

    // Get dana bulan ini
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const [danaBulanIniRows] = await pool.query(`
      SELECT COALESCE(SUM(nominal), 0) as total 
      FROM transaksi 
      WHERE MONTH(tanggal_setor) = ? AND YEAR(tanggal_setor) = ?
    `, [currentMonth, currentYear])
    const totalDanaBulanIni = parseFloat(danaBulanIniRows[0].total) || 0

    // Get statistik pembayaran bulan ini
    // Hitung berdasarkan KEPALA KELUARGA (per rumah), bukan total warga
    // Karena transaksi dihitung per rumah (1 rumah = 1 kepala keluarga)
    
    // Hitung total kepala keluarga (total rumah)
    const totalKepalaKeluarga = totalRumah
    
    // Hitung berapa kepala keluarga yang sudah bayar bulan ini
    const [kepalaKeluargaBayarRows] = await pool.query(`
      SELECT COUNT(DISTINCT w.id_warga) as total
      FROM transaksi t
      INNER JOIN warga w ON t.id_warga = w.id_warga
      INNER JOIN rumah r ON w.id_rumah = r.id_rumah
      WHERE w.id_warga = r.id_kepala_keluarga
        AND MONTH(t.tanggal_setor) = ? 
        AND YEAR(t.tanggal_setor) = ?
    `, [currentMonth, currentYear])
    const kepalaKeluargaSudahBayar = kepalaKeluargaBayarRows[0].total

    // Hitung persentase berdasarkan kepala keluarga
    const persenSudahBayar = totalKepalaKeluarga > 0 ? Math.round((kepalaKeluargaSudahBayar / totalKepalaKeluarga) * 100) : 0
    const persenBelumBayar = 100 - persenSudahBayar

    // Get transaksi hari ini
    const [transaksiHariIniRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM transaksi
      WHERE DATE(tanggal_setor) = ?
    `, [today])
    const transaksiHariIni = transaksiHariIniRows[0].total

    console.log("[DASHBOARD] Stats:", {
      totalWarga,
      totalRumah,
      totalDanaHariIni,
      totalDanaBulanIni,
      totalKepalaKeluarga,
      kepalaKeluargaSudahBayar,
      persenSudahBayar,
      persenBelumBayar,
      transaksiHariIni
    })

    res.json({
      success: true,
      data: {
        totalWarga,
        totalRumah,
        totalDanaHariIni,
        totalDanaBulanIni,
        statistikPembayaran: {
          sudahBayar: kepalaKeluargaSudahBayar,
          belumBayar: totalKepalaKeluarga - kepalaKeluargaSudahBayar,
          persenSudahBayar,
          persenBelumBayar
        },
        transaksiHariIni
      }
    })

  } catch (error) {
    console.error("[DASHBOARD] Error:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik dashboard",
      error: error.message
    })
  }
}
