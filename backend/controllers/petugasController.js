// backend/controllers/petugasController.js
import { pool } from "../config/database.js";

export const getAllPetugas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_petugas AS id, w.nama_lengkap AS namaWarga, w.nik, kr.nama_kelompok AS namaKelompok,
             p.jabatan, p.role, p.status, p.username, p.created_at, p.updated_at
      FROM petugas p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
      ORDER BY p.id_petugas DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data petugas", error: error.message });
  }
};

export const getPetugasById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM petugas WHERE id_petugas = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil petugas", error: error.message });
  }
};

export const createPetugas = async (req, res) => {
  try {
    const { id_warga, id_kelompok_ronda, jabatan, role, status, username, password } = req.body;
    if (!id_warga) return res.status(400).json({ success: false, message: "id_warga wajib diisi" });
    const [result] = await pool.query("INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id_warga, id_kelompok_ronda || null, jabatan || null, role || "Petugas", status || "Aktif", username || null, password || null]);
    res.status(201).json({ success: true, message: "Petugas berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan petugas", error: error.message });
  }
};

export const updatePetugas = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_warga, id_kelompok_ronda, jabatan, role, status, username, password } = req.body;
    const [result] = await pool.query("UPDATE petugas SET id_warga = ?, id_kelompok_ronda = ?, jabatan = ?, role = ?, status = ?, username = ?, password = ?, updated_at = NOW() WHERE id_petugas = ?",
      [id_warga, id_kelompok_ronda || null, jabatan || null, role || "Petugas", status || "Aktif", username || null, password || null, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    res.json({ success: true, message: "Data petugas berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui petugas", error: error.message });
  }
};

export const deletePetugas = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM petugas WHERE id_petugas = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    res.json({ success: true, message: "Data petugas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus petugas", error: error.message });
  }
};
