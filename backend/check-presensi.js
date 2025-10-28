import { pool } from './config/database.js';

async function checkPresensiData() {
  try {
    console.log('Checking presensi data...');
    
    // Check presensi data
    const [presensiRows] = await pool.query(`
      SELECT p.id_presensi AS id, p.id_warga, w.nama_lengkap AS namaWarga, p.tanggal, p.check_in, p.status
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      ORDER BY p.tanggal DESC, p.created_at DESC
    `);
    
    console.log(`📋 Total presensi records: ${presensiRows.length}`);
    if (presensiRows.length > 0) {
      console.log('📋 Presensi data:');
      console.table(presensiRows.slice(0, 10)); // Show last 10 records
    } else {
      console.log('❌ No presensi data found');
    }
    
    // Check today's presensi
    const today = new Date().toISOString().split('T')[0];
    const [todayRows] = await pool.query(`
      SELECT p.id_presensi AS id, p.id_warga, w.nama_lengkap AS namaWarga, p.tanggal, p.check_in, p.status
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      WHERE p.tanggal = ?
      ORDER BY p.created_at DESC
    `, [today]);
    
    console.log(`\n📅 Today's presensi (${today}): ${todayRows.length} records`);
    if (todayRows.length > 0) {
      console.table(todayRows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking presensi data:', error.message);
    process.exit(1);
  }
}

checkPresensiData();