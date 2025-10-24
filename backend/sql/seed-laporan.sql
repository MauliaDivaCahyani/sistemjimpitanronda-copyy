USE fundraising_dbcopyyy;

INSERT INTO laporan (id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar)
VALUES
(2, 1, 1, 'Oktober', 2025, 20000, 20000, 'Sudah Bayar'),
(3, 2, 1, 'Oktober', 2025, 15000, 15000, 'Sudah Bayar'),
(4, 3, 2, 'Oktober', 2025, 30000, 0, 'Belum Bayar');
