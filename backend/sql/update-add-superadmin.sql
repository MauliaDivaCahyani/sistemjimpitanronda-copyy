-- =====================================================
-- UPDATE DATABASE: Tambah Role Superadmin
-- =====================================================
USE fundraising_dbcopyyy;

-- Step 1: Ubah ENUM role untuk menambahkan 'Superadmin'
ALTER TABLE petugas 
MODIFY COLUMN role ENUM('Superadmin','Admin','Petugas','Warga') DEFAULT 'Petugas';

-- Step 2: Tambahkan user superadmin1
-- Username: superadmin1
-- Password: superadmin123
INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES (NULL, NULL, 'Super Administrator', 'Superadmin', 'Aktif', 'superadmin1', 'superadmin123')
ON DUPLICATE KEY UPDATE 
    role = 'Superadmin', 
    jabatan = 'Super Administrator',
    status = 'Aktif';

-- Step 3: Verifikasi
SELECT 'Update berhasil! User superadmin1 telah ditambahkan.' as message;
SELECT id_petugas, username, role, jabatan, status FROM petugas WHERE role = 'Superadmin';
