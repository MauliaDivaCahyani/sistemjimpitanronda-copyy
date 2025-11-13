USE fundraising_dbcopyyy;

INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES
(NULL, NULL, 'Super Administrator', 'Superadmin', 'Aktif', 'superadmin1', 'superadmin123'),
(1, 1, 'Ketua Ronda', 'Admin', 'Aktif', 'admin_ronda', 'admin123'),
(2, 1, 'Anggota', 'Petugas', 'Aktif', 'siti_petugas', 'siti123'),
(3, 2, 'Anggota', 'Petugas', 'Aktif', 'andi_petugas', 'andi123');