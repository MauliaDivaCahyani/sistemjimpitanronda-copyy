// backend/controllers/jenisDanaController.js
import { pool } from "../config/database.js";

export const getAllJenisDana = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_jenis_dana AS id, nama_dana AS namaDana, deskripsi, created_at, updated_at FROM jenis_dana ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data", error: error.message });
  }
};

export const getJenisDanaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id_jenis_dana AS id, nama_dana AS namaDana, deskripsi FROM jenis_dana WHERE id_jenis_dana = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data", error: error.message });
  }
};

export const createJenisDana = async (req, res) => {
  try {
    const { namaDana, deskripsi } = req.body;
    if (!namaDana) return res.status(400).json({ success: false, message: "Nama dana wajib diisi" });

    const [result] = await pool.query("INSERT INTO jenis_dana (nama_dana, deskripsi) VALUES (?, ?)", [namaDana, deskripsi || null]);
    res.status(201).json({ success: true, message: "Data berhasil ditambahkan", id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan data", error: error.message });
  }
};

export const updateJenisDana = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaDana, deskripsi } = req.body;
    const [result] = await pool.query("UPDATE jenis_dana SET nama_dana = ?, deskripsi = ?, updated_at = NOW() WHERE id_jenis_dana = ?", [namaDana, deskripsi || null, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui data", error: error.message });
  }
};

export const deleteJenisDana = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM jenis_dana WHERE id_jenis_dana = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus data", error: error.message });
  }
};
