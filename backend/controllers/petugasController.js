// backend/controllers/petugasController.js
import { pool } from "../config/database.js";

export const getAllPetugas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_petugas AS id,
        w.nama_lengkap AS namaLengkap,
        w.nik,
        kr.nama_kelompok AS alamat, -- di-mapping ke "alamat"
        p.jabatan,
        p.role,
        CASE WHEN p.status = 'Aktif' THEN TRUE ELSE FALSE END AS statusUser,
        p.username,
        '' AS password,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM petugas p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
      ORDER BY p.id_petugas DESC
    `)

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data petugas",
      error: error.message,
    })
  }
}


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
    const { idWarga, jabatan, role, statusUser, username, password } = req.body;
    
    console.log("DEBUG CREATE PETUGAS - Data received:", { idWarga, jabatan, role, statusUser, username });
    
    if (!idWarga) {
      return res.status(400).json({ success: false, message: "idWarga wajib diisi" });
    }
    if (!username) {
      return res.status(400).json({ success: false, message: "Username wajib diisi" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password wajib diisi" });
    }
    
    // Convert statusUser boolean to string for database
    const status = statusUser ? "Aktif" : "Tidak Aktif";
    
    const [result] = await pool.query(
      "INSERT INTO petugas (id_warga, jabatan, role, status, username, password) VALUES (?, ?, ?, ?, ?, ?)",
      [idWarga, jabatan || null, role || "petugas", status, username, password]
    );
    
    res.status(201).json({ 
      success: true, 
      message: "Petugas berhasil ditambahkan", 
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error("Error creating petugas:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menambahkan petugas", 
      error: error.message 
    });
  }
};

export const updatePetugas = async (req, res) => {
  try {
    const { id } = req.params;
    const { jabatan, role, statusUser, username, password } = req.body;
    
    console.log("DEBUG UPDATE PETUGAS - Data received:", { id, jabatan, role, statusUser, username });
    
    if (!username) {
      return res.status(400).json({ success: false, message: "Username wajib diisi" });
    }
    
    // Convert statusUser boolean to string for database
    const status = statusUser ? "Aktif" : "Tidak Aktif";
    
    // Prepare update query - only update password if provided
    let updateQuery = "UPDATE petugas SET jabatan = ?, role = ?, status = ?, username = ?, updated_at = NOW()";
    let queryParams = [jabatan || null, role || "petugas", status, username];
    
    if (password && password.trim() !== "") {
      updateQuery += ", password = ?";
      queryParams.push(password);
    }
    
    updateQuery += " WHERE id_petugas = ?";
    queryParams.push(id);
    
    const [result] = await pool.query(updateQuery, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" });
    }
    
    res.json({ success: true, message: "Data petugas berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating petugas:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal memperbarui petugas", 
      error: error.message 
    });
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
