// backend/controllers/transaksiController.js
import { pool } from "../config/database.js";

export const getAllTransaksi = async (req, res) => {
  try {
    const { id_warga, tanggal } = req.query;
    
    let query = `
      SELECT 
        t.id_transaksi AS id, 
        t.id_warga,
        t.id_jenis_dana,
        t.id_user,
        t.tanggal_setor,
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
    `;
    
    const conditions = [];
    const params = [];
    
    if (id_warga) {
      conditions.push('t.id_warga = ?');
      params.push(id_warga);
    }
    
    if (tanggal) {
      conditions.push('DATE(t.tanggal_setor) = ?');
      params.push(tanggal);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.waktu_input DESC';
    
    const [rows] = await pool.query(query, params);
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
      tanggal_setor, 
      nominal, 
      status_jimpitan 
    } = req.body;
    
    console.log("DEBUG CREATE TRANSAKSI - Data received:", { 
      id_warga, 
      id_jenis_dana, 
      id_user, 
      tanggal_setor, 
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

    // Get id_rumah dari warga
    const [wargaRows] = await pool.query(
      'SELECT id_rumah FROM warga WHERE id_warga = ?',
      [id_warga]
    );
    
    const idRumah = wargaRows.length > 0 ? wargaRows[0].id_rumah : null;

    // Set default values
    const tanggalSetor = tanggal_setor || new Date().toISOString().split('T')[0];
    const tanggalBayar = tanggalSetor; // tanggal_bayar sama dengan tanggal_setor
    const statusJimpitan = status_jimpitan || 'lunas';

    const [result] = await pool.query(`
      INSERT INTO transaksi (
        id_warga, 
        id_jenis_dana, 
        id_user, 
        id_rumah,
        tanggal_setor, 
        tanggal_bayar,
        waktu_input, 
        nominal,
        jumlah_bayar,
        status_jimpitan,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, 'Berhasil')
    `, [
      id_warga, 
      id_jenis_dana, 
      id_user,
      idRumah,
      tanggalSetor,
      tanggalBayar,
      nominal,
      nominal, // jumlah_bayar sama dengan nominal
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
      tanggal_setor, 
      nominal, 
      status_jimpitan 
    } = req.body;
    
    // Get id_rumah dari warga
    const [wargaRows] = await pool.query(
      'SELECT id_rumah FROM warga WHERE id_warga = ?',
      [id_warga]
    );
    
    const idRumah = wargaRows.length > 0 ? wargaRows[0].id_rumah : null;
    
    const [result] = await pool.query(`
      UPDATE transaksi 
      SET 
        id_warga = ?, 
        id_jenis_dana = ?, 
        id_user = ?,
        id_rumah = ?,
        tanggal_setor = ?,
        tanggal_bayar = ?,
        nominal = ?,
        jumlah_bayar = ?,
        status_jimpitan = ?,
        status = 'Berhasil',
        updated_at = NOW() 
      WHERE id_transaksi = ?
    `, [
      id_warga, 
      id_jenis_dana, 
      id_user,
      idRumah,
      tanggal_setor,
      tanggal_setor, // tanggal_bayar sama dengan tanggal_setor
      nominal,
      nominal, // jumlah_bayar sama dengan nominal
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
