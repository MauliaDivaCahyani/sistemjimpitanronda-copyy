// backend/controllers/transaksiController.js
import { pool } from "../config/database.js";

export const getAllTransaksi = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id_transaksi AS id, r.alamat AS alamatRumah, jd.nama_dana AS jenisDana, t.tanggal_bayar AS tanggal,
             t.jenis_transaksi, t.jumlah_bayar AS jumlah, t.status, t.created_at, t.updated_at
      FROM transaksi t
      LEFT JOIN rumah r ON t.id_rumah = r.id_rumah
      LEFT JOIN jenis_dana jd ON t.id_jenis_dana = jd.id_jenis_dana
      ORDER BY t.tanggal_bayar DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data transaksi", error: error.message });
  }
};

export const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM transaksi WHERE id_transaksi = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil transaksi", error: error.message });
  }
};

export const createTransaksi = async (req, res) => {
  try {
    const { id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status } = req.body;
    if (!id_rumah || !id_jenis_dana || !jumlah_bayar || !tanggal_bayar) {
      return res.status(400).json({ success: false, message: "id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar wajib diisi" });
    }
    const [result] = await pool.query("INSERT INTO transaksi (id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi || "Masuk", status || "Pending"]);
    res.status(201).json({ success: true, message: "Transaksi berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan transaksi", error: error.message });
  }
};

export const updateTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status } = req.body;
    const [result] = await pool.query("UPDATE transaksi SET id_rumah = ?, id_jenis_dana = ?, jumlah_bayar = ?, tanggal_bayar = ?, jenis_transaksi = ?, status = ?, updated_at = NOW() WHERE id_transaksi = ?",
      [id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, message: "Transaksi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui transaksi", error: error.message });
  }
};

export const deleteTransaksi = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM transaksi WHERE id_transaksi = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus transaksi", error: error.message });
  }
};
