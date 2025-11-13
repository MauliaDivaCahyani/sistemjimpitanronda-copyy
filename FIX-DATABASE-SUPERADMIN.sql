-- =====================================================
-- URGENT FIX: Update Database untuk Role Superadmin
-- =====================================================
-- Jalankan file ini di phpMyAdmin atau MySQL Workbench
-- Database: fundraising_dbcopyyy
-- =====================================================

USE fundraising_dbcopyyy;

-- Step 1: Tampilkan struktur role sebelum diubah
SELECT 'BEFORE UPDATE:' as step;
SHOW COLUMNS FROM petugas LIKE 'role';

-- Step 2: Ubah ENUM role untuk menambahkan 'Superadmin'
ALTER TABLE petugas 
MODIFY COLUMN role ENUM('Superadmin','Admin','Petugas','Warga') DEFAULT 'Petugas';

-- Step 3: Tampilkan struktur role setelah diubah
SELECT 'AFTER UPDATE:' as step;
SHOW COLUMNS FROM petugas LIKE 'role';

-- Step 4: Update data yang role-nya NULL menjadi 'Petugas'
UPDATE petugas SET role = 'Petugas' WHERE role IS NULL;

-- Step 5: Tambahkan user superadmin1 jika belum ada
INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES (NULL, NULL, 'Super Administrator', 'Superadmin', 'Aktif', 'superadmin1', 'superadmin123')
ON DUPLICATE KEY UPDATE 
    role = 'Superadmin', 
    jabatan = 'Super Administrator',
    status = 'Aktif';

-- Step 6: Tampilkan semua data petugas
SELECT 'ALL PETUGAS DATA:' as step;
SELECT id_petugas, username, role, jabatan, status, created_at 
FROM petugas 
ORDER BY id_petugas;

-- Step 7: Verifikasi superadmin
SELECT 'SUPERADMIN USERS:' as step;
SELECT id_petugas, username, role, jabatan, status 
FROM petugas 
WHERE role = 'Superadmin';

SELECT '✅ Database berhasil diupdate! Restart backend server sekarang.' as message;
