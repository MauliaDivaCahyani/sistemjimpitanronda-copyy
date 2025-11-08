-- =========================================================
-- ALTER TABLE presensi - Tambah opsi Sakit dan Alpha
-- =========================================================
USE fundraising_dbcopyyy;

-- Ubah ENUM status di tabel presensi untuk menambah 'Sakit' dan 'Alpha'
ALTER TABLE presensi 
MODIFY COLUMN status ENUM('Hadir','Tidak Hadir','Izin','Sakit','Alpha') DEFAULT 'Hadir';

-- Verifikasi perubahan
DESCRIBE presensi;

SELECT 'Migration completed: presensi.status ENUM updated successfully!' AS message;
