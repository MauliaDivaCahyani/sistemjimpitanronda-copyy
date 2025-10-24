# Fundraising Management Backend API

Backend API untuk sistem manajemen fundraising menggunakan Node.js, Express, dan MySQL.

## Setup

### 1. Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Database Configuration

Buat file `.env` di folder `backend` dengan konfigurasi berikut:

\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fundraising_db
DB_PORT=3306

PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
\`\`\`

### 3. Setup Database

Jalankan script SQL untuk membuat database dan tabel:

\`\`\`bash
mysql -u root -p < ../scripts/create-warga-table.sql
mysql -u root -p < ../scripts/seed-warga-data.sql
\`\`\`

Atau jalankan manual di MySQL:

\`\`\`sql
source /path/to/scripts/create-warga-table.sql;
source /path/to/scripts/seed-warga-data.sql;
\`\`\`

### 4. Run Server

Development mode:
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm start
\`\`\`

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### Warga (Residents)

#### Get All Warga

\`\`\`
GET /api/warga
\`\`\`

Response:
\`\`\`json
{
"success": true,
"data": [
{
"id": "warga-001",
"idRumah": "rumah-001",
"nama": "Budi Santoso",
"nik": "3201012345678901",
"nomorHp": "081234567890",
"jenisKelamin": "Laki-laki",
"statusAktif": true,
"createdAt": "2024-01-01T00:00:00.000Z",
"updatedAt": "2024-01-01T00:00:00.000Z",
"rumah": {
"alamat": "Jl. Merdeka No. 10",
"rt": "01",
"rw": "05"
}
}
]
}
\`\`\`

#### Get Warga by ID

\`\`\`
GET /api/warga/:id
\`\`\`

#### Create Warga

\`\`\`
POST /api/warga
Content-Type: application/json

{
"idRumah": "rumah-001",
"nama": "John Doe",
"nik": "3201012345678907",
"nomorHp": "081234567896",
"jenisKelamin": "Laki-laki",
"statusAktif": true
}
\`\`\`

#### Update Warga

\`\`\`
PUT /api/warga/:id
Content-Type: application/json

{
"idRumah": "rumah-001",
"nama": "John Doe Updated",
"nik": "3201012345678907",
"nomorHp": "081234567896",
"jenisKelamin": "Laki-laki",
"statusAktif": true
}
\`\`\`

#### Delete Warga

\`\`\`
DELETE /api/warga/:id
\`\`\`

### Health Check

\`\`\`
GET /api/health
\`\`\`

## Database Schema

### Table: warga

| Column        | Type         | Description                  |
| ------------- | ------------ | ---------------------------- |
| id            | VARCHAR(36)  | Primary key (UUID)           |
| id_rumah      | VARCHAR(36)  | Foreign key to rumah table   |
| nama          | VARCHAR(255) | Full name                    |
| nik           | VARCHAR(16)  | National ID (unique)         |
| nomor_hp      | VARCHAR(20)  | Phone number                 |
| jenis_kelamin | ENUM         | Gender (Laki-laki/Perempuan) |
| status_aktif  | BOOLEAN      | Active status                |
| created_at    | TIMESTAMP    | Creation timestamp           |
| updated_at    | TIMESTAMP    | Last update timestamp        |

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
"success": false,
"message": "Error message",
"error": "Detailed error (development only)"
}
\`\`\`

## CORS Configuration

CORS is configured to allow requests from the frontend URL specified in `.env` file.
