// Script untuk update ENUM status di tabel presensi
import { pool } from './config/database.js';

async function updateStatusEnum() {
  try {
    console.log('Checking current ENUM values...');
    
    // Cek ENUM saat ini
    const [columns] = await pool.query('SHOW COLUMNS FROM presensi WHERE Field = "status"');
    console.log('Current status ENUM:', columns[0].Type);
    
    // Update ENUM untuk menambahkan Sakit dan Alpha
    console.log('\nUpdating ENUM to include Sakit and Alpha...');
    await pool.query(`
      ALTER TABLE presensi 
      MODIFY COLUMN status ENUM('Hadir','Tidak Hadir','Izin','Sakit','Alpha') DEFAULT 'Hadir'
    `);
    
    console.log('✅ ENUM updated successfully!');
    
    // Verifikasi update
    const [newColumns] = await pool.query('SHOW COLUMNS FROM presensi WHERE Field = "status"');
    console.log('New status ENUM:', newColumns[0].Type);
    
    console.log('\n✅ Database schema updated successfully!');
    console.log('Status options now: Hadir, Tidak Hadir, Izin, Sakit, Alpha');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updateStatusEnum();
