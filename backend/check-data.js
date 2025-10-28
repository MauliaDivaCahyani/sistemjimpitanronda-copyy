import { pool } from './config/database.js';

async function checkData() {
  try {
    console.log('Checking existing data...');
    
    // Check rumah data
    const [rumahRows] = await pool.query('SELECT COUNT(*) as count FROM rumah');
    console.log(`📍 Rumah count: ${rumahRows[0].count}`);
    
    const [rumahData] = await pool.query('SELECT id_rumah, alamat FROM rumah ORDER BY id_rumah');
    console.log('📍 Rumah data:');
    console.table(rumahData);
    
    // Check warga data
    const [wargaRows] = await pool.query('SELECT COUNT(*) as count FROM warga');
    console.log(`👥 Warga count: ${wargaRows[0].count}`);
    
    const [wargaData] = await pool.query('SELECT id_warga, nama_lengkap, id_rumah FROM warga ORDER BY id_warga');
    console.log('👥 Warga data:');
    console.table(wargaData);
    
    // Check petugas data
    const [petugasData] = await pool.query(`
      SELECT p.id_petugas, p.id_warga, p.jabatan, w.nama_lengkap 
      FROM petugas p 
      LEFT JOIN warga w ON p.id_warga = w.id_warga 
      ORDER BY p.id_petugas
    `);
    console.log('👮 Petugas data:');
    console.table(petugasData);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    process.exit(1);
  }
}

checkData();