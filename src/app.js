import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/env.js";
import logger from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// Middlewares
import { apiLimiter } from "./middleware/rateLimiter.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.disable("x-powered-by");

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = config.clientOrigin.split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching clientOrigin
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Không được phép bởi chính sách CORS"));
    }
  },
  credentials: true
}));

// HTTP Logging with Morgan into Winston
app.use(
  morgan(config.nodeEnv === "production" ? "combined" : "dev", {
    stream: { write: (message) => logger.http(message.trim()) }
  })
);

// Body Parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

// Rate Limiting
app.use("/api", apiLimiter);

// Serve static uploaded media files
app.use("/uploads", express.static(path.resolve(config.upload.dir)));

// Swagger API Documentation UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "CarShowroom API Docs"
}));

// Root / Welcome Endpoint
app.get("/", (req, res) => res.json({
  success: true,
  name: "CarShowroom Enterprise API",
  version: "2.0.0",
  docs: "/api/docs",
  health: "/api/health"
}));

// Health Check Endpoint
app.get("/api/health", async (req, res, next) => {
  try {
    const { default: pool } = await import("./config/db.js");
    await pool.query("SELECT 1");
    res.json({
      success: true,
      data: {
        api: "healthy",
        database: "connected",
        aiProvider: config.aiProvider,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Register Module Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
