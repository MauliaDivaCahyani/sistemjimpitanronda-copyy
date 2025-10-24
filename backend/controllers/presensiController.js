// backend/controllers/presensiController.js
import { pool } from "../config/database.js";

export const getAllPresensi = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_presensi AS id, w.nama_lengkap AS namaWarga, pe.username AS namaPetugas, p.tanggal, p.check_in, p.check_out,
             p.status, p.keterangan, p.created_at, p.updated_at
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN petugas pe ON p.id_petugas = pe.id_petugas
      ORDER BY p.tanggal DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data presensi", error: error.message });
  }
};

export const getPresensiById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM presensi WHERE id_presensi = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Presensi tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil presensi", error: error.message });
  }
};

export const createPresensi = async (req, res) => {
  try {
    const { id_warga, id_petugas, id_kelompok_ronda, tanggal, check_in, check_out, status, keterangan } = req.body;
    if (!id_warga || !tanggal) return res.status(400).json({ success: false, message: "id_warga dan tanggal wajib diisi" });
    const [result] = await pool.query("INSERT INTO presensi (id_warga, id_kelompok_ronda, tanggal, check_in, check_out, keterangan, status, id_petugas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id_warga, id_kelompok_ronda || null, tanggal, check_in || null, check_out || null, keterangan || null, status || "Hadir", id_petugas || null]);
    res.status(201).json({ success: true, message: "Presensi berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan presensi", error: error.message });
  }
};

export const updatePresensi = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_warga, id_petugas, id_kelompok_ronda, tanggal, check_in, check_out, status, keterangan } = req.body;
    const [result] = await pool.query("UPDATE presensi SET id_warga = ?, id_kelompok_ronda = ?, tanggal = ?, check_in = ?, check_out = ?, keterangan = ?, status = ?, id_petugas = ?, updated_at = NOW() WHERE id_presensi = ?",
      [id_warga, id_kelompok_ronda || null, tanggal, check_in || null, check_out || null, keterangan || null, status || "Hadir", id_petugas || null, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Presensi tidak ditemukan" });
    res.json({ success: true, message: "Presensi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui presensi", error: error.message });
  }
};

export const deletePresensi = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM presensi WHERE id_presensi = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Presensi tidak ditemukan" });
    res.json({ success: true, message: "Presensi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus presensi", error: error.message });
  }
};