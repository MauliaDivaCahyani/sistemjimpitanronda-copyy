// backend/controllers/presensiController.js
import { pool } from "../config/database.js";

export const getAllPresensi = async (req, res) => {
  try {
    let query = `
      SELECT p.id_presensi AS id, p.id_warga, w.nama_lengkap AS namaWarga, pe.username AS namaPetugas, p.tanggal, 
             DATE_FORMAT(p.check_in, '%Y-%m-%d %H:%i:%s') AS check_in, 
             DATE_FORMAT(p.check_out, '%Y-%m-%d %H:%i:%s') AS check_out,
             p.status, p.keterangan, p.created_at, p.updated_at
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN petugas pe ON p.id_petugas = pe.id_petugas
    `;
    
    const queryParams = [];
    
    // Handle date filtering
    if (req.query.startDate || req.query.endDate) {
      query += " WHERE ";
      const conditions = [];
      
      if (req.query.startDate) {
        conditions.push("p.tanggal >= ?");
        // Parse date string directly (already in YYYY-MM-DD format)
        queryParams.push(req.query.startDate);
        console.log("Backend getAllPresensi - startDate param:", req.query.startDate);
      }
      
      if (req.query.endDate) {
        conditions.push("p.tanggal < ?");
        // Parse date string directly (already in YYYY-MM-DD format)
        queryParams.push(req.query.endDate);
        console.log("Backend getAllPresensi - endDate param:", req.query.endDate);
      }
      
      query += conditions.join(" AND ");
    }
    
    query += " ORDER BY p.tanggal DESC";
    
    console.log("Backend getAllPresensi - Query:", query);
    console.log("Backend getAllPresensi - Params:", queryParams);
    
    const [rows] = await pool.query(query, queryParams);
    console.log("Backend getAllPresensi - Found rows:", rows.length);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Backend getAllPresensi - Error:", error);
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
    console.log("=== CREATE PRESENSI ===")
    console.log("Request body:", JSON.stringify(req.body, null, 2))
    
    const { id_warga, id_petugas, id_kelompok_ronda, tanggal, check_in, check_out, status, keterangan } = req.body;
    
    console.log("Parsed data:")
    console.log("  id_warga:", id_warga, typeof id_warga)
    console.log("  status:", `"${status}"`, typeof status)
    console.log("  tanggal:", tanggal)
    
    if (!id_warga || !tanggal) {
      console.log("Validation failed: id_warga or tanggal missing")
      return res.status(400).json({ success: false, message: "id_warga dan tanggal wajib diisi" });
    }
    
    // Cek apakah sudah ada presensi untuk id_warga dan tanggal yang sama
    const [existing] = await pool.query(
      "SELECT id_presensi, status FROM presensi WHERE id_warga = ? AND DATE(tanggal) = DATE(?)",
      [id_warga, tanggal]
    );
    
    if (existing.length > 0) {
      console.log(`Found existing attendance: id=${existing[0].id_presensi}, old_status="${existing[0].status}", new_status="${status}"`)
      // Jika sudah ada, update saja data yang sudah ada
      const updateQuery = "UPDATE presensi SET status = ?, check_in = ?, check_out = ?, keterangan = ?, id_petugas = ?, updated_at = NOW() WHERE id_warga = ? AND DATE(tanggal) = DATE(?)";
      const updateParams = [status || "Hadir", check_in || null, check_out || null, keterangan || null, id_petugas || null, id_warga, tanggal];
      
      console.log("SQL Update Query:", updateQuery)
      console.log("SQL Update Params:", JSON.stringify(updateParams))
      
      const [updateResult] = await pool.query(updateQuery, updateParams);
      console.log("Update result:", updateResult.affectedRows, "rows affected")
      console.log("=== UPDATE PRESENSI SUCCESS ===")
      return res.status(200).json({ success: true, message: "Presensi berhasil diperbarui", data: { id: existing[0].id_presensi } });
    }
    
    // Jika belum ada, buat baru
    const query = "INSERT INTO presensi (id_warga, id_kelompok_ronda, tanggal, check_in, check_out, keterangan, status, id_petugas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [id_warga, id_kelompok_ronda || null, tanggal, check_in || null, check_out || null, keterangan || null, status || "Hadir", id_petugas || null];
    
    console.log("SQL Query:", query)
    console.log("SQL Params:", JSON.stringify(params))
    
    const [result] = await pool.query(query, params);
    
    console.log("Insert result:", result.insertId)
    console.log("=== CREATE PRESENSI SUCCESS ===")
    
    res.status(201).json({ success: true, message: "Presensi berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    console.error("=== CREATE PRESENSI ERROR ===")
    console.error("Error:", error)
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