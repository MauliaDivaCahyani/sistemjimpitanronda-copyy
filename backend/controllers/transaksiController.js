// backend/controllers/transaksiController.js
import { pool } from "../config/database.js";

export const getAllTransaksi = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id_transaksi AS id, 
        t.id_warga,
        t.id_user,
        t.tanggal_selor,
        t.waktu_input,
        t.nominal,
        t.status_jimpitan,
        w.nama_lengkap AS namaWarga,
        w.nik AS nikWarga,
        jd.nama_dana AS jenisDana,
        t.created_at, 
        t.updated_at
      FROM transaksi t
      LEFT JOIN warga w ON t.id_warga = w.id_warga
      LEFT JOIN jenis_dana jd ON t.id_jenis_dana = jd.id_jenis_dana
      ORDER BY t.waktu_input DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getting all transaksi:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data transaksi", error: error.message });
  }
};

export const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        t.*,
        w.nama_lengkap AS namaWarga,
        w.nik AS nikWarga,
        jd.nama_dana AS jenisDana,
        jd.deskripsi AS deskripsiJenis
      FROM transaksi t
      LEFT JOIN warga w ON t.id_warga = w.id_warga
      LEFT JOIN jenis_dana jd ON t.id_jenis_dana = jd.id_jenis_dana
      WHERE t.id_transaksi = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error getting transaksi by id:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil transaksi", error: error.message });
  }
};

export const createTransaksi = async (req, res) => {
  try {
    const { 
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggal_selor, 
      nominal, 
      status_jimpitan 
    } = req.body;
    
    console.log("DEBUG CREATE TRANSAKSI - Data received:", { 
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggal_selor, 
      nominal, 
      status_jimpitan 
    });
    
    // Validasi required fields
    if (!id_warga || !id_jenis_dana || !id_user || !nominal) {
      return res.status(400).json({ 
        success: false, 
        message: "id_warga, id_jenis_dana, id_user, dan nominal wajib diisi" 
      });
    }

    // Set default values
    const tanggalSelor = tanggal_selor || new Date().toISOString().split('T')[0];
    const statusJimpitan = status_jimpitan || 'lunas';

    const [result] = await pool.query(`
      INSERT INTO transaksi (
        id_warga, 
        id_jenis_dana, 
        id_user, 
        tanggal_selor, 
        waktu_input, 
        nominal, 
        status_jimpitan
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
    `, [
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggalSelor, 
      nominal, 
      statusJimpitan
    ]);
    
    res.status(201).json({ 
      success: true, 
      message: "Transaksi berhasil ditambahkan", 
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error("Error creating transaksi:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan transaksi", error: error.message });
  }
};

export const updateTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggal_selor, 
      nominal, 
      status_jimpitan 
    } = req.body;
    
    const [result] = await pool.query(`
      UPDATE transaksi 
      SET 
        id_warga = ?, 
        id_jenis_dana = ?, 
        id_user = ?, 
        tanggal_selor = ?, 
        nominal = ?, 
        status_jimpitan = ?, 
        updated_at = NOW() 
      WHERE id_transaksi = ?
    `, [
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggal_selor, 
      nominal, 
      status_jimpitan, 
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    
    res.json({ success: true, message: "Transaksi berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating transaksi:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui transaksi", error: error.message });
  }
};

export const deleteTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM transaksi WHERE id_transaksi = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting transaksi:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus transaksi", error: error.message });
  }
};

// Get transaksi by warga
export const getTransaksiByWarga = async (req, res) => {
  try {
    const { id_warga } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        t.*,
        jd.nama_dana AS jenisDana
      FROM transaksi t
      LEFT JOIN jenis_dana jd ON t.id_jenis_dana = jd.id_jenis_dana
      WHERE t.id_warga = ?
      ORDER BY t.waktu_input DESC
    `, [id_warga]);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getting transaksi by warga:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil transaksi warga", error: error.message });
  }
};
