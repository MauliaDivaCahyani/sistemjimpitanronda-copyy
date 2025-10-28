import { pool } from './config/database.js';

async function fixWargaData() {
  try {
    console.log('Adding missing warga data for petugas...');
    
    const insertQuery = `
      INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, status_aktif)
      VALUES
      (1, 'Drs. Ahmad Wijaya', '3276010101010007', '081234567896', 'L', 'Aktif'),
      (2, 'Sari Dewi, S.Pd', '3276010101010008', '081234567897', 'P', 'Aktif'),
      (3, 'Bambang Hidayat', '3276010101010009', '081234567898', 'L', 'Aktif'),
      (4, 'Rahmat Susilo', '3276010101010010', '081234567899', 'L', 'Aktif'),
      (5, 'Hendi Kurniawan', '3276010101010011', '081234567800', 'L', 'Aktif')
    `;
    
    await pool.query(insertQuery);
    console.log('✅ Successfully added missing warga data');
    
    // Verify the data
    const [rows] = await pool.query(`
      SELECT w.id_warga, w.nama_lengkap, p.jabatan 
      FROM warga w 
      LEFT JOIN petugas p ON w.id_warga = p.id_warga 
      WHERE w.id_warga >= 7
    `);
    
    console.log('✅ Verification - Warga data with petugas:');
    console.table(rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing warga data:', error.message);
    process.exit(1);
  }
}

fixWargaData();