import mysql from "mysql2/promise";
import { config } from "./env.js";

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: "Z"
});

export async function checkDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
}

export default pool;
