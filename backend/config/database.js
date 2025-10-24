import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "fundraising_dbcopyyy",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("[v0] Database connected successfully");
    connection.release();
  } catch (error) {
    console.error("[v0] Database connection failed:", error.message);
    process.exit(1);
  }
}

export { pool, testConnection };