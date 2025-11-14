USE fundraising_dbcopyyy;

INSERT INTO presensi (id_warga, id_kelompok_ronda, tanggal, check_in, check_out, keterangan, status, id_petugas) VALUES
(1, 1, '2025-11-03', '2025-11-03 20:00:00', '2025-11-04 05:00:00', 'Ronda malam Senin berjalan lancar', 'Hadir', 1),
(2, 2, '2025-11-05', NULL, NULL, 'Izin karena sakit di hari Rabu', 'Izin', 2),
(2, NULL, '2025-11-12', '2025-11-12 13:21:18', NULL, NULL, 'Hadir', NULL);