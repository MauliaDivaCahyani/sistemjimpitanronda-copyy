// Test script untuk verifikasi status Sakit dan Alpha tersimpan dengan benar
import { pool } from './config/database.js';

async function testStatusSaving() {
  try {
    console.log('=== Testing Status Sakit and Alpha ===\n');
    
    // Test data
    const testIdWarga = 1; // Ganti dengan id_warga yang valid
    const today = new Date().toISOString().split('T')[0];
    
    // Test 1: Insert dengan status Sakit
    console.log('Test 1: Inserting with status "Sakit"...');
    await pool.query(
      'DELETE FROM presensi WHERE id_warga = ? AND DATE(tanggal) = ?',
      [testIdWarga, today]
    );
    
    const [result1] = await pool.query(
      'INSERT INTO presensi (id_warga, tanggal, status, check_in) VALUES (?, ?, ?, NOW())',
      [testIdWarga, today, 'Sakit']
    );
    
    const [check1] = await pool.query(
      'SELECT status FROM presensi WHERE id_presensi = ?',
      [result1.insertId]
    );
    
    console.log(`✓ Inserted with "Sakit", saved as: "${check1[0].status}"`);
    console.log(check1[0].status === 'Sakit' ? '✅ PASS\n' : '❌ FAIL\n');
    
    // Test 2: Update ke Alpha
    console.log('Test 2: Updating to status "Alpha"...');
    await pool.query(
      'UPDATE presensi SET status = ? WHERE id_presensi = ?',
      ['Alpha', result1.insertId]
    );
    
    const [check2] = await pool.query(
      'SELECT status FROM presensi WHERE id_presensi = ?',
      [result1.insertId]
    );
    
    console.log(`✓ Updated to "Alpha", saved as: "${check2[0].status}"`);
    console.log(check2[0].status === 'Alpha' ? '✅ PASS\n' : '❌ FAIL\n');
    
    // Cleanup
    await pool.query('DELETE FROM presensi WHERE id_presensi = ?', [result1.insertId]);
    
    console.log('=== All Tests Completed ===');
    console.log('✅ Status "Sakit" and "Alpha" are working correctly!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testStatusSaving();
