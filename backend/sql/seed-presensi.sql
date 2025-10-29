USE fundraising_dbcopyyy;

INSERT INTO presensi (id_warga, id_kelompok_ronda, tanggal, check_in, check_out, status, id_petugas, keterangan)
VALUES
(1, 1, '2025-10-28', '2025-10-28 20:00:00', '2025-10-29 04:00:00', 'Hadir', 1, 'Ronda malam berjalan lancar'),
(2, 1, '2025-10-28', '2025-10-28 20:15:00', '2025-10-29 03:50:00', 'Hadir', 1, 'Menjaga di pos timur'),
(3, 2, '2025-10-28', NULL, NULL, 'Tidak Hadir', 2, 'Sedang sakit');