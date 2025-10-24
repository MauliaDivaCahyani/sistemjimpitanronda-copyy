// backend/controllers/wargaController.js
import { pool } from "../config/database.js";

export const getAllWarga = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.id_warga AS id, w.nama_lengkap AS namaLengkap, w.nik, w.nomor_hp AS nomorHp,
             w.jenis_kelamin AS jenisKelamin, w.status_aktif AS statusAktif, r.alamat AS alamatRumah, r.rt, r.rw
      FROM warga w LEFT JOIN rumah r ON w.id_rumah = r.id_rumah
      ORDER BY w.id_warga DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data warga", error: error.message });
  }
};

export const getWargaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT w.id_warga AS id, w.nama_lengkap AS namaLengkap, w.nik, w.nomor_hp AS nomorHp,
             w.jenis_kelamin AS jenisKelamin, w.status_aktif AS statusAktif, w.id_rumah AS idRumah, r.alamat AS alamatRumah
      FROM warga w LEFT JOIN rumah r ON w.id_rumah = r.id_rumah WHERE w.id_warga = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Data warga tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil warga", error: error.message });
  }
};

export const createWarga = async (req, res) => {
  try {
    const { idRumah, namaLengkap, nik, nomorHp, jenisKelamin, statusAktif } = req.body;
    if (!namaLengkap || !jenisKelamin) return res.status(400).json({ success: false, message: "namaLengkap dan jenisKelamin wajib diisi" });
    const [result] = await pool.query("INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, status_aktif) VALUES (?, ?, ?, ?, ?, ?)",
      [idRumah || null, namaLengkap, nik || null, nomorHp || null, jenisKelamin, statusAktif || "Aktif"]);
    res.status(201).json({ success: true, message: "Data warga berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan warga", error: error.message });
  }
};

export const updateWarga = async (req, res) => {
  try {
    const { id } = req.params;
    const { idRumah, namaLengkap, nik, nomorHp, jenisKelamin, statusAktif } = req.body;
    const [result] = await pool.query("UPDATE warga SET id_rumah = ?, nama_lengkap = ?, nik = ?, nomor_hp = ?, jenis_kelamin = ?, status_aktif = ?, updated_at = NOW() WHERE id_warga = ?",
      [idRumah || null, namaLengkap, nik || null, nomorHp || null, jenisKelamin, statusAktif || "Aktif", id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Data warga tidak ditemukan" });
    res.json({ success: true, message: "Data warga berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui warga", error: error.message });
  }
};

export const deleteWarga = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM warga WHERE id_warga = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Data warga tidak ditemukan" });
    res.json({ success: true, message: "Data warga berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus warga", error: error.message });
  }
};
