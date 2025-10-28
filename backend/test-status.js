import { pool } from './config/database.js';

async function testStatusSaving() {
  try {
    console.log('Testing status saving...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Test different statuses
    const testCases = [
      { id_warga: 46, status: 'Hadir', nama: 'Handoko' },
      { id_warga: 48, status: 'Izin', nama: 'Reza Fakhrudin' },
      { id_warga: 51, status: 'Tidak Hadir', nama: 'Wahid' }, // Untuk sakit/alpha
      { id_warga: 52, status: 'Izin', nama: 'Firda' }
    ];
    
    // Delete existing records for today first
    await pool.query("DELETE FROM presensi WHERE tanggal = ?", [today]);
    
    for (const testCase of testCases) {
      console.log(`\nTesting ${testCase.nama} with status: ${testCase.status}`);
      
      const [result] = await pool.query(
        "INSERT INTO presensi (id_warga, tanggal, check_in, status) VALUES (?, ?, ?, ?)",
        [testCase.id_warga, today, new Date(), testCase.status]
      );
      
      console.log(`✅ Inserted with ID: ${result.insertId}`);
    }
    
    // Verify all data
    const [rows] = await pool.query(`
      SELECT p.id_presensi AS id, p.id_warga, w.nama_lengkap AS namaWarga, p.status, p.tanggal
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      WHERE p.tanggal = ?
      ORDER BY p.id_warga
    `, [today]);
    
    console.log('\n✅ All records for today:');
    console.table(rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing status:', error.message);
    process.exit(1);
  }
}

testStatusSaving();