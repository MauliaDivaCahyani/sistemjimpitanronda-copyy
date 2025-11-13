# 🔐 PANDUAN SUPERADMIN - Sistem Dana Warga

## 📌 Ringkasan
Role **Superadmin** telah ditambahkan dengan username **superadmin1** dan memiliki akses penuh seperti Admin.

---

## 🚀 LANGKAH INSTALASI (WAJIB DILAKUKAN SEKALI)

### **STEP 1: Update Database**

⚠️ **PENTING:** Anda WAJIB menjalankan SQL update ini terlebih dahulu!

#### **Cara A: Via MySQL Command Line** (Tercepat)

Buka PowerShell/CMD dan jalankan:

```powershell
# Masuk ke folder project
cd D:\sistemjimpitanronda-copyy

# Jalankan SQL update
mysql -u root -p -P 3307 < backend\sql\update-add-superadmin.sql
```

Masukkan password MySQL Anda ketika diminta (jika ada).

#### **Cara B: Via phpMyAdmin** (Manual)

1. Buka browser: `http://localhost/phpmyadmin`
2. Login dengan user MySQL Anda
3. Pilih database: **`fundraising_dbcopyyy`**
4. Klik tab **"SQL"**
5. Copy paste SQL berikut:

```sql
-- Ubah ENUM role untuk menambahkan 'Superadmin'
ALTER TABLE petugas 
MODIFY COLUMN role ENUM('Superadmin','Admin','Petugas','Warga') DEFAULT 'Petugas';

-- Tambahkan user superadmin1
INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES (NULL, NULL, 'Super Administrator', 'Superadmin', 'Aktif', 'superadmin1', 'superadmin123')
ON DUPLICATE KEY UPDATE 
    role = 'Superadmin', 
    jabatan = 'Super Administrator',
    status = 'Aktif';
```

6. Klik tombol **"Go"** atau **"Kirim"**

#### **Verifikasi Database**

Cek apakah berhasil dengan query ini:

```sql
-- Lihat struktur role
SHOW COLUMNS FROM petugas LIKE 'role';

-- Lihat user superadmin1
SELECT id_petugas, username, role, jabatan, status 
FROM petugas 
WHERE username = 'superadmin1';
```

**Expected Result:**
```
id_petugas | username     | role       | jabatan               | status
-----------|--------------|------------|-----------------------|--------
1          | superadmin1  | Superadmin | Super Administrator   | Aktif
```

---

### **STEP 2: Jalankan Backend Server**

Buka **Terminal 1** (PowerShell/CMD):

```powershell
cd D:\sistemjimpitanronda-copyy\backend
npm install
npm start
```

✅ Backend akan jalan di: **http://localhost:5006**

Pastikan Anda melihat log:
```
[v0] Database connected successfully
Server is running on port 5006
```

---

### **STEP 3: Jalankan Frontend Server**

Buka **Terminal 2** (PowerShell/CMD baru):

```powershell
cd D:\sistemjimpitanronda-copyy
npm install
npm run dev
```

✅ Frontend akan jalan di: **http://localhost:3000**

---

## 🔑 LOGIN SEBAGAI SUPERADMIN

### **Kredensial Login:**

1. Buka browser: **http://localhost:3000**
2. Pilih tab: **"Petugas/Admin"** (bukan "Warga")
3. Masukkan:
   - **Username**: `superadmin1`
   - **Password**: `superadmin123`
4. Klik tombol **"Login"**

### **Yang Akan Anda Lihat:**

Setelah login berhasil, Anda akan diarahkan ke **Dashboard** dengan tampilan seperti Admin yang menampilkan:
- Total Warga
- Total Rumah
- Total Dana Hari Ini
- Total Dana Bulan Ini
- Statistik Pembayaran

---

## 🎯 AKSES & FITUR SUPERADMIN

Superadmin memiliki **akses penuh** sama seperti Admin:

### **✅ Menu yang Dapat Diakses:**

| Menu | Deskripsi | Akses |
|------|-----------|-------|
| **Dashboard** | Statistik lengkap sistem | ✅ Full |
| **Data Rumah** | Tambah/Edit/Hapus rumah, Generate barcode | ✅ Full |
| **Data Warga** | Tambah/Edit/Hapus warga | ✅ Full |
| **Data Petugas** | Tambah/Edit/Hapus petugas (termasuk Superadmin baru) | ✅ Full |
| **Kelompok Ronda** | Manage kelompok dan jadwal | ✅ Full |
| **Jenis Dana** | Manage jenis dana | ✅ Full |
| **Transaksi Dana** | Input transaksi, lihat history, export | ✅ Full |
| **Absensi** | Check-in/out, riwayat presensi | ✅ Full |
| **Laporan** | Generate laporan bulanan, export Excel | ✅ Full |
| **Settings** | Ubah password, update profile | ✅ Full |

---

## 👥 MEMBUAT SUPERADMIN BARU

Sebagai Superadmin, Anda dapat membuat Superadmin lain:

1. **Login** sebagai superadmin1
2. Buka menu **"Data Petugas"**
3. Klik tombol **"+ Tambah Petugas"**
4. Isi form:
   - **Nama Warga**: Pilih dari dropdown (atau biarkan kosong jika tidak terkait warga)
   - **Username**: `superadmin2` (atau username lain)
   - **Password**: `password123` (atau password lain)
   - **Jabatan**: `Super Administrator`
   - **Kelompok Ronda**: Pilih atau "Tidak Ada"
   - **Role**: Pilih **"Super Administrator"**
   - **Status**: Centang ✅ Aktif
5. Klik **"Simpan"**

---

## 🔄 MAPPING ROLE (Technical Info)

Sistem menggunakan mapping role yang konsisten:

| Layer | Superadmin | Admin | Petugas | Warga |
|-------|------------|-------|---------|-------|
| **Database (MySQL)** | `Superadmin` | `Admin` | `Petugas` | `Warga` |
| **Backend API** | `super_admin` | `admin` | `petugas` | `warga` |
| **Frontend** | `super_admin` | `admin` | `petugas` | `warga` |
| **Display** | Super Administrator | Administrator | Petugas | Warga |

---

## 🔧 TROUBLESHOOTING

### ❌ **Problem 1: "Username tidak ditemukan atau tidak aktif"**

**Penyebab:** Database belum di-update atau user belum dibuat.

**Solusi:**
```sql
-- Cek apakah user ada
SELECT * FROM petugas WHERE username = 'superadmin1';

-- Jika tidak ada, jalankan lagi
INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES (NULL, NULL, 'Super Administrator', 'Superadmin', 'Aktif', 'superadmin1', 'superadmin123');
```

### ❌ **Problem 2: "Data truncated for column 'role'"**

**Penyebab:** ENUM role belum diupdate.

**Solusi:**
```sql
ALTER TABLE petugas 
MODIFY COLUMN role ENUM('Superadmin','Admin','Petugas','Warga') DEFAULT 'Petugas';
```

### ❌ **Problem 3: Backend tidak jalan**

**Solusi:**
```powershell
cd backend
npm install
npm start
```

Pastikan tidak ada aplikasi lain yang menggunakan port 5006.

### ❌ **Problem 4: Frontend tidak jalan**

**Solusi:**
```powershell
npm install
npm run dev
```

Pastikan tidak ada aplikasi lain yang menggunakan port 3000.

### ❌ **Problem 5: "Cannot connect to backend"**

**Solusi:**
1. Pastikan backend running di http://localhost:5006
2. Test dengan: `curl http://localhost:5006/api/health`
3. Cek file `.env` di root project:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5006/api
   ```

### ❌ **Problem 6: Role Superadmin tidak muncul di dropdown**

**Solusi:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Restart backend server

---

## 🧪 TESTING

### **Test 1: Test Login via API**

```powershell
curl -X POST http://localhost:5006/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"identifier":"superadmin1","password":"superadmin123","loginType":"username"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "1",
      "nama": "superadmin1",
      "role": "super_admin",
      "username": "superadmin1"
    },
    "token": "..."
  }
}
```

### **Test 2: Test Get All Petugas**

```powershell
curl http://localhost:5006/api/petugas
```

Harus melihat user dengan role `super_admin`.

---

## 📊 PERBEDAAN ROLE

| Fitur | Warga | Petugas | Admin | Superadmin |
|-------|-------|---------|-------|------------|
| Dashboard | ✅ Terbatas | ✅ Kelompok | ✅ Penuh | ✅ Penuh |
| Data Rumah | ❌ | ❌ | ✅ | ✅ |
| Data Warga | ❌ | ❌ | ✅ | ✅ |
| Data Petugas | ❌ | ❌ | ✅ | ✅ |
| Kelompok Ronda | ❌ | ✅ Info | ✅ Manage | ✅ Manage |
| Jenis Dana | ❌ | ❌ | ✅ | ✅ |
| Transaksi | ✅ Lihat | ✅ Input | ✅ Full | ✅ Full |
| Absensi | ✅ Check-in | ✅ Manage | ✅ Manage | ✅ Manage |
| Laporan | ❌ | ✅ Terbatas | ✅ Full | ✅ Full |
| Buat Superadmin | ❌ | ❌ | ✅ | ✅ |

**Kesimpulan:** Superadmin = Admin (level akses sama)

---

## 📂 FILE YANG DIMODIFIKASI

### **Backend:**
1. ✅ `backend/sql/create-tables.sql` - Schema ditambah 'Superadmin'
2. ✅ `backend/sql/update-add-superadmin.sql` - **FILE BARU** untuk update database
3. ✅ `backend/sql/seed-petugas.sql` - Ditambah user superadmin1
4. ✅ `backend/controllers/authController.js` - Role mapping saat login
5. ✅ `backend/controllers/petugasController.js` - Role mapping CRUD

### **Frontend:**
6. ✅ `components/forms/petugas-form.tsx` - Role mapping form

---

## ✅ CHECKLIST INSTALASI

Pastikan semua langkah ini sudah dilakukan:

- [ ] SQL update berhasil dijalankan (`update-add-superadmin.sql`)
- [ ] User `superadmin1` sudah ada di database
- [ ] Backend berjalan di port 5006
- [ ] Frontend berjalan di port 3000
- [ ] Login berhasil dengan username: `superadmin1`, password: `superadmin123`
- [ ] Dashboard menampilkan data seperti Admin
- [ ] Menu "Data Petugas" dapat membuat Superadmin baru

---

## 🎓 USER CREDENTIALS YANG TERSEDIA

Setelah instalasi, Anda memiliki user berikut:

| Username | Password | Role | Akses |
|----------|----------|------|-------|
| `superadmin1` | `superadmin123` | Superadmin | ✅ Full Access |
| `admin_ronda` | `admin123` | Admin | ✅ Full Access |
| `siti_petugas` | `siti123` | Petugas | ⚠️ Limited |
| `andi_petugas` | `andi123` | Petugas | ⚠️ Limited |

---

## 💡 TIPS

1. **Ganti Password**: Setelah login pertama kali, segera ganti password superadmin di menu Settings
2. **Backup Database**: Selalu backup database sebelum membuat perubahan besar
3. **Testing**: Test di browser incognito untuk memastikan tidak ada cache issue
4. **Logging**: Cek console browser (F12) untuk debug jika ada masalah

---

## 📞 SUPPORT

Jika mengalami masalah:
1. Cek log di terminal backend
2. Cek console browser (F12)
3. Cek database dengan query di atas
4. Pastikan kedua server (backend & frontend) berjalan

---

## 🎉 SELESAI!

**Role Superadmin sudah siap digunakan dengan username: `superadmin1`**

Selamat menggunakan sistem!
