import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME || "Anh Duy";

if (!email || !password || password.length < 12) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in environment before running this script.");
  process.exit(1);
}

try {
  const [existing] = await pool.execute("SELECT id FROM users WHERE email=?", [email.toLowerCase()]);
  if (existing.length) {
    console.error("An account with this email already exists. No changes made.");
    process.exitCode = 1;
  } else {
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
      [fullName, email.toLowerCase(), hash]
    );
    console.log(`Admin account created: ${email}`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
