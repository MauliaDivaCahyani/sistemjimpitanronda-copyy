USE fundraising_dbcopyyy;

INSERT INTO presensi (
  id_warga,
  id_kelompok_ronda,
  tanggal,
  check_in,
  check_out,
  keterangan,
  status,
  id_petugas
)
VALUES
(22, 1, '2025-10-01', '2025-10-01 20:00:00', '2025-10-02 04:00:00', 'Ronda malam lancar', 'Hadir', 11),
(23, 1, '2025-10-02', '2025-10-02 20:00:00', '2025-10-03 04:00:00', 'Menemani ronda', 'Hadir', 12),
(25, 2, '2025-10-03', NULL, NULL, 'Izin karena sakit', 'Izin', 14);
