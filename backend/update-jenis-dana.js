import { pool } from './config/database.js';

async function updateJenisDanaTable() {
  try {
    console.log('🔄 Memulai update tabel jenis_dana...');
    
    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'fundraising_dbcopyyy' 
      AND TABLE_NAME = 'jenis_dana'
      AND COLUMN_NAME IN ('nominal_default', 'periode_bayar', 'is_active')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Kolom yang sudah ada:', existingColumns);
    
    // Add missing columns
    if (!existingColumns.includes('nominal_default')) {
      await pool.query('ALTER TABLE jenis_dana ADD COLUMN nominal_default DECIMAL(12,2) DEFAULT 0 AFTER deskripsi');
      console.log('✅ Kolom nominal_default berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('periode_bayar')) {
      await pool.query("ALTER TABLE jenis_dana ADD COLUMN periode_bayar ENUM('harian', 'mingguan', 'bulanan', 'tahunan') DEFAULT 'harian' AFTER nominal_default");
      console.log('✅ Kolom periode_bayar berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('is_active')) {
      await pool.query('ALTER TABLE jenis_dana ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER periode_bayar');
      console.log('✅ Kolom is_active berhasil ditambahkan');
    }
    
    // Update existing data
    await pool.query(`
      UPDATE jenis_dana 
      SET 
        nominal_default = COALESCE(nominal_default, 5000),
        periode_bayar = COALESCE(periode_bayar, 'harian'),
        is_active = COALESCE(is_active, TRUE)
      WHERE id_jenis_dana IS NOT NULL
    `);
    
    console.log('✅ Update tabel jenis_dana selesai!');
    
  } catch (error) {
    console.error('❌ Error updating jenis_dana table:', error);
  } finally {
    process.exit();
  }
}

updateJenisDanaTable();