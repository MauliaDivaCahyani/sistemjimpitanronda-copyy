// backend/controllers/laporanController.js
import { pool } from "../config/database.js";

export const createLaporan = async (req, res) => {
  try {
    const { id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar } = req.body;
    const [result] = await pool.query(
      `INSERT INTO laporan (id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_rumah || null, id_jenis_dana || null, id_kelompok_ronda || null, bulan || null, tahun || null, total_jimpitan || 0, total_transaksi || 0, status_bayar || "Belum Bayar"]
    );
    res.status(201).json({ success: true, message: "Laporan berhasil ditambahkan", id_laporan: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllLaporan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id_laporan, r.alamat AS alamatRumah, jd.nama_dana AS namaJenisDana, kr.nama_kelompok AS namaKelompok,
             l.bulan, l.tahun, l.total_jimpitan, l.total_transaksi, l.status_bayar, l.created_at, l.updated_at
      FROM laporan l
      LEFT JOIN rumah r ON l.id_rumah = r.id_rumah
      LEFT JOIN jenis_dana jd ON l.id_jenis_dana = jd.id_jenis_dana
      LEFT JOIN kelompok_ronda kr ON l.id_kelompok_ronda = kr.id_kelompok_ronda
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM laporan WHERE id_laporan = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar } = req.body;
    const [result] = await pool.query(
      `UPDATE laporan SET id_rumah=?, id_jenis_dana=?, id_kelompok_ronda=?, bulan=?, tahun=?, total_jimpitan=?, total_transaksi=?, status_bayar=?, updated_at = NOW()
       WHERE id_laporan=?`,
      [id_rumah || null, id_jenis_dana || null, id_kelompok_ronda || null, bulan || null, tahun || null, total_jimpitan || 0, total_transaksi || 0, status_bayar || "Belum Bayar", id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, message: "Laporan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM laporan WHERE id_laporan = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, message: "Laporan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Generate laporan real-time dari data transaksi
export const generateLaporan = async (req, res) => {
  try {
    const { periode = 'bulanan', bulan, tahun, kelompok } = req.query;
    
    console.log('[LAPORAN] Generate with params:', { periode, bulan, tahun, kelompok });
    
    // Build date filter
    let dateFilter = '';
    const params = [];
    
    if (periode === 'bulanan' && bulan && tahun) {
      dateFilter = 'AND MONTH(t.tanggal_setor) = ? AND YEAR(t.tanggal_setor) = ?';
      params.push(parseInt(bulan) + 1, parseInt(tahun)); // bulan di frontend 0-indexed
    } else if (periode === 'tahunan' && tahun) {
      dateFilter = 'AND YEAR(t.tanggal_setor) = ?';
      params.push(parseInt(tahun));
    } else if (periode === 'harian') {
      dateFilter = 'AND DATE(t.tanggal_setor) = CURDATE()';
    } else if (periode === 'mingguan') {
      dateFilter = 'AND t.tanggal_setor >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    }
    
    // Summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT t.id_transaksi) as totalTransaksi,
        COALESCE(SUM(t.nominal), 0) as totalJimpitan,
        COUNT(DISTINCT r.id_rumah) as rumahSudahBayar
      FROM transaksi t
      INNER JOIN warga w ON t.id_warga = w.id_warga
      INNER JOIN rumah r ON r.id_kepala_keluarga = w.id_warga
      WHERE 1=1 ${dateFilter}
    `;
    
    const [summaryRows] = await pool.query(summaryQuery, params);
    const summary = summaryRows[0];
    
    // Total rumah (kepala keluarga)
    const [rumahCount] = await pool.query('SELECT COUNT(*) as total FROM rumah WHERE id_kepala_keluarga IS NOT NULL');
    summary.totalRumah = rumahCount[0].total;
    summary.rumahBelumBayar = summary.totalRumah - summary.rumahSudahBayar;
    
    // Rekap per rumah (berdasarkan kepala keluarga)
    const rekapQuery = `
      SELECT 
        r.id_rumah,
        r.alamat,
        w.nama_lengkap as kepalaKeluarga,
        w.nik,
        r.rt,
        r.rw,
        COALESCE(SUM(t.nominal), 0) as totalBayar,
        COUNT(t.id_transaksi) as jumlahTransaksi,
        CASE WHEN COUNT(t.id_transaksi) > 0 THEN 1 ELSE 0 END as sudahBayar
      FROM rumah r
      INNER JOIN warga w ON r.id_kepala_keluarga = w.id_warga
      LEFT JOIN transaksi t ON w.id_warga = t.id_warga ${dateFilter.replace('t.tanggal_setor', 't.tanggal_setor')}
      GROUP BY r.id_rumah, r.alamat, w.nama_lengkap, w.nik, r.rt, r.rw
      ORDER BY r.id_rumah ASC
    `;
    
    const [rekapRows] = await pool.query(rekapQuery, params);
    
    // Detail transaksi untuk laporan lengkap
    const transaksiQuery = `
      SELECT 
        t.id_transaksi,
        t.tanggal_setor,
        w.nama_lengkap as namaWarga,
        jd.nama_dana as jenisDana,
        t.nominal,
        t.status,
        t.created_at as waktuInput
      FROM transaksi t
      INNER JOIN warga w ON t.id_warga = w.id_warga
      INNER JOIN jenis_dana jd ON t.id_jenis_dana = jd.id_jenis_dana
      WHERE 1=1 ${dateFilter}
      ORDER BY t.tanggal_setor DESC, t.created_at DESC
    `;
    
    const [transaksiRows] = await pool.query(transaksiQuery, params);
    
    console.log('[LAPORAN] Summary:', summary);
    console.log('[LAPORAN] Rekap count:', rekapRows.length);
    console.log('[LAPORAN] Transaksi count:', transaksiRows.length);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalJimpitan: parseFloat(summary.totalJimpitan) || 0,
          totalTransaksi: summary.totalTransaksi || 0,
          wargaSudahBayar: summary.rumahSudahBayar || 0,
          wargaBelumBayar: summary.rumahBelumBayar || 0,
          totalWarga: summary.totalRumah || 0
        },
        rekapPerRumah: rekapRows.map(row => ({
          idRumah: row.id_rumah,
          alamat: row.alamat,
          kepalaKeluarga: row.kepalaKeluarga,
          nik: row.nik,
          rt: row.rt,
          rw: row.rw,
          totalBayar: parseFloat(row.totalBayar) || 0,
          jumlahTransaksi: row.jumlahTransaksi || 0,
          sudahBayar: row.sudahBayar === 1
        })),
        detailTransaksi: transaksiRows.map(row => ({
          idTransaksi: row.id_transaksi,
          tanggalSetor: row.tanggal_setor,
          namaWarga: row.namaWarga,
          jenisDana: row.jenisDana,
          nominal: parseFloat(row.nominal) || 0,
          status: row.status,
          waktuInput: row.waktuInput
        }))
      }
    });
  } catch (err) {
    console.error('[LAPORAN] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
