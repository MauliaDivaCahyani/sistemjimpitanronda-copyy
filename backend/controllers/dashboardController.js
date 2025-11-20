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

    // Get statistik pembayaran HARI INI (bukan bulan ini)
    // Hitung berdasarkan RUMAH yang sudah bayar HARI INI
    
    // Hitung total rumah yang memiliki kepala keluarga
    const [totalRumahKKRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM rumah
      WHERE id_kepala_keluarga IS NOT NULL
    `)
    const totalRumahDenganKK = totalRumahKKRows[0].total
    
    // Hitung berapa rumah yang sudah bayar HARI INI
    // (ada minimal 1 transaksi hari ini dari warga yang tinggal di rumah tersebut)
    const [rumahBayarRows] = await pool.query(`
      SELECT COUNT(DISTINCT r.id_rumah) as total
      FROM transaksi t
      INNER JOIN warga w ON t.id_warga = w.id_warga
      INNER JOIN rumah r ON w.id_rumah = r.id_rumah
      WHERE DATE(t.tanggal_setor) = ?
        AND r.id_kepala_keluarga IS NOT NULL
    `, [today])
    const rumahSudahBayar = rumahBayarRows[0].total

    // Hitung persentase berdasarkan rumah
    const persenSudahBayar = totalRumahDenganKK > 0 ? Math.round((rumahSudahBayar / totalRumahDenganKK) * 100) : 0
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
      totalRumahDenganKK,
      rumahSudahBayar,
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
          sudahBayar: rumahSudahBayar,
          belumBayar: totalRumahDenganKK - rumahSudahBayar,
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
