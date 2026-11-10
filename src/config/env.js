import dotenv from "dotenv";
dotenv.config();

const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env and configure it.`);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  apiUrl: process.env.API_URL || "http://localhost:5000",
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "SkyCar",
    fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@skycar.vn"
  },
  aiProvider: process.env.AI_PROVIDER || "mock",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "",
  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxFileSize: Number(process.env.MAX_FILE_SIZE || 5242880)
  }
};
