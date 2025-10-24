-- =========================================================
-- ALTER TABLE: jenis_dana
-- Menambahkan kolom yang diperlukan untuk frontend
-- =========================================================
USE fundraising_dbcopyyy;

-- Menambahkan kolom baru ke tabel jenis_dana
ALTER TABLE jenis_dana 
ADD COLUMN nominal_default DECIMAL(12,2) DEFAULT 0 AFTER deskripsi,
ADD COLUMN periode_bayar ENUM('harian', 'mingguan', 'bulanan', 'tahunan') DEFAULT 'harian' AFTER nominal_default,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER periode_bayar;

-- Update data existing jika ada
UPDATE jenis_dana 
SET 
    nominal_default = 5000,
    periode_bayar = 'harian',
    is_active = TRUE
WHERE nominal_default IS NULL;