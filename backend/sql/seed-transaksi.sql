USE fundraising_dbcopyyy;

INSERT INTO transaksi (id_warga, id_user, tanggal_setor, nominal, status_jimpitan, id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status) VALUES
(1, 1, '2025-11-03', 2000.00, 'lunas', 1, 1, 2000.00, '2025-11-03', 'Masuk', 'Berhasil'),
(2, 2, '2025-11-05', 10000.00, 'lunas', 2, 2, 10000.00, '2025-11-05', 'Masuk', 'Berhasil'),
(2, 1, '2025-11-12', 5000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending'),
(2, 1, '2025-11-12', 1500.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending'),
(1, 1, '2025-11-12', 2000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending'),
(3, 1, '2025-11-13', 1000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending'),
(1, 2, '2025-11-13', 1000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending');