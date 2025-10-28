import { pool } from './config/database.js';

async function testCreatePresensi() {
  try {
    console.log('Testing create presensi...');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Test data untuk salah satu petugas
    const testData = {
      id_warga: 44, // Tugini
      tanggal: today,
      check_in: new Date(),
      status: 'Hadir'
    };
    
    console.log('Inserting test data:', testData);
    
    const [result] = await pool.query(
      "INSERT INTO presensi (id_warga, tanggal, check_in, status) VALUES (?, ?, ?, ?)",
      [testData.id_warga, testData.tanggal, testData.check_in, testData.status]
    );
    
    console.log('✅ Test presensi created with ID:', result.insertId);
    
    // Verify the data
    const [rows] = await pool.query(`
      SELECT p.id_presensi AS id, p.id_warga, w.nama_lengkap AS namaWarga, p.tanggal, p.check_in, p.status
      FROM presensi p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      WHERE p.id_presensi = ?
    `, [result.insertId]);
    
    console.log('✅ Verified created data:');
    console.table(rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing presensi:', error.message);
    process.exit(1);
  }
}

testCreatePresensi();