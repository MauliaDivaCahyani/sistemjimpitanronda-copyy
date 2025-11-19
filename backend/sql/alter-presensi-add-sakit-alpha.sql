-- Menambahkan 'Sakit' dan 'Alpha' ke ENUM status di tabel presensi
-- Jalankan SQL ini di phpMyAdmin untuk database: fundraising_dbcopyyy

ALTER TABLE presensi 
MODIFY COLUMN status ENUM('Hadir','Tidak Hadir','Izin','Sakit','Alpha') DEFAULT 'Hadir';

-- Verifikasi perubahan
DESCRIBE presensi;

-- Cek data yang sudah ada
SELECT id_presensi, id_warga, tanggal, status 
FROM presensi 
ORDER BY tanggal DESC 
LIMIT 10;
