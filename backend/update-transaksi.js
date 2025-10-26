import { pool } from './config/database.js';

async function updateTransaksiTable() {
  try {
    console.log('🔄 Memulai update tabel transaksi...');
    
    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'fundraising_dbcopyyy' 
      AND TABLE_NAME = 'transaksi'
      AND COLUMN_NAME IN ('id_warga', 'id_user', 'tanggal_selor', 'waktu_input', 'nominal', 'status_jimpitan')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Kolom yang sudah ada:', existingColumns);
    
    // Add missing columns for new requirements
    if (!existingColumns.includes('id_warga')) {
      await pool.query('ALTER TABLE transaksi ADD COLUMN id_warga INT AFTER id_transaksi');
      console.log('✅ Kolom id_warga berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('id_user')) {
      await pool.query('ALTER TABLE transaksi ADD COLUMN id_user INT AFTER id_warga');
      console.log('✅ Kolom id_user berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('tanggal_selor')) {
      await pool.query('ALTER TABLE transaksi ADD COLUMN tanggal_selor DATE AFTER id_user');
      console.log('✅ Kolom tanggal_selor berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('waktu_input')) {
      await pool.query('ALTER TABLE transaksi ADD COLUMN waktu_input DATETIME DEFAULT CURRENT_TIMESTAMP AFTER tanggal_selor');
      console.log('✅ Kolom waktu_input berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('nominal')) {
      await pool.query('ALTER TABLE transaksi ADD COLUMN nominal DECIMAL(12,2) AFTER waktu_input');
      console.log('✅ Kolom nominal berhasil ditambahkan');
    }
    
    if (!existingColumns.includes('status_jimpitan')) {
      await pool.query("ALTER TABLE transaksi ADD COLUMN status_jimpitan ENUM('lunas', 'belum_lunas') DEFAULT 'lunas' AFTER nominal");
      console.log('✅ Kolom status_jimpitan berhasil ditambahkan');
    }
    
    // Add foreign key constraints
    try {
      await pool.query('ALTER TABLE transaksi ADD FOREIGN KEY (id_warga) REFERENCES warga(id_warga) ON DELETE SET NULL ON UPDATE CASCADE');
      console.log('✅ Foreign key id_warga berhasil ditambahkan');
    } catch (error) {
      console.log('⚠️  Foreign key id_warga sudah ada atau error:', error.message);
    }
    
    try {
      await pool.query('ALTER TABLE transaksi ADD FOREIGN KEY (id_user) REFERENCES petugas(id_user) ON DELETE SET NULL ON UPDATE CASCADE');
      console.log('✅ Foreign key id_user berhasil ditambahkan');
    } catch (error) {
      console.log('⚠️  Foreign key id_user sudah ada atau error:', error.message);
    }
    
    console.log('✅ Update tabel transaksi selesai!');
    
  } catch (error) {
    console.error('❌ Error updating transaksi table:', error);
  } finally {
    process.exit();
  }
}

updateTransaksiTable();