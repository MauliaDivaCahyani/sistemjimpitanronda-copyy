USE fundraising_dbcopyyy;

-- Menambahkan warga untuk id_warga 7-11 yang direferensikan oleh petugas
INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, status_aktif)
VALUES
(1, 'Drs. Ahmad Wijaya', '3276010101010007', '081234567896', 'L', 'Aktif'),  -- id_warga 7 - Ketua RT
(2, 'Sari Dewi, S.Pd', '3276010101010008', '081234567897', 'P', 'Aktif'),    -- id_warga 8 - Sekretaris
(3, 'Bambang Hidayat', '3276010101010009', '081234567898', 'L', 'Aktif'),    -- id_warga 9 - Bendahara
(4, 'Rahmat Susilo', '3276010101010010', '081234567899', 'L', 'Aktif'),      -- id_warga 10 - Koordinator Ronda
(5, 'Hendi Kurniawan', '3276010101010011', '081234567800', 'L', 'Aktif');    -- id_warga 11 - Anggota Ronda