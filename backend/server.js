import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { testConnection } from "./config/database.js"

// ✅ Import semua routes
import authRoutes from "./routes/authRoutes.js"
import petugasRoutes from "./routes/petugasRoutes.js"
import wargaRoutes from "./routes/wargaRoutes.js"
import rumahRoutes from "./routes/rumahRoutes.js"
import kelompokRondaRoutes from "./routes/kelompokRondaRoutes.js"
import jenisDanaRoutes from "./routes/jenisDanaRoutes.js"
import transaksiRoutes from "./routes/transaksiRoutes.js"
import presensiRoutes from "./routes/presensiRoutes.js"
import laporanRoutes from "./routes/laporanRoutes.js"
import wargaRondaRoutes from "./routes/wargaRondaRoutes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5006

// ✅ Middleware
// Middleware untuk logging semua request
app.use((req, res, next) => {
  console.log(`[v0] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`[v0] Request headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[v0] Request body:`, req.body);
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[v0] Response status: ${res.statusCode}`);
    console.log(`[v0] Response data:`, data);
    originalSend.call(this, data);
  };
  
  next();
});

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// ✅ Register API routes
app.use("/api/auth", authRoutes)
app.use("/api/petugas", petugasRoutes)
app.use("/api/warga", wargaRoutes)
app.use("/api/rumah", rumahRoutes)
app.use("/api/kelompok-ronda", kelompokRondaRoutes)
app.use("/api/jenis-dana", jenisDanaRoutes)
app.use("/api/transaksi", transaksiRoutes)
app.use("/api/presensi", presensiRoutes)
app.use("/api/laporan", laporanRoutes)
app.use("/api/warga-ronda", wargaRondaRoutes)

// ✅ Default API root info
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Jimpitan API",
    available_routes: [
      "/api/auth",
      "/api/petugas",
      "/api/warga",
      "/api/rumah",
      "/api/kelompok-ronda",
      "/api/jenis-dana",
      "/api/transaksi",
      "/api/presensi",
      "/api/laporan",
      "/api/warga-ronda",
      "/api/health",
    ],
  })
})

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  })
})

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Server Error]:", err)
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// ✅ Jalankan koneksi database & server
const startServer = async () => {
  try {
    await testConnection()
    app.listen(PORT, () => {
      console.log(`[v0] Server running on port ${PORT}`)
      console.log(`[v0] Environment: ${process.env.NODE_ENV || "development"}`)
      console.log("[v0] Database connection OK, starting server routes...")
    })
  } catch (error) {
    console.error("[v0] Database connection failed:", error.message)
    process.exit(1)
  }
}

startServer()
