import { config } from "./config/env.js";
import app from "./app.js";
import { checkDatabase } from "./config/db.js";
import logger from "./config/logger.js";
import { initCronJobs } from "./jobs/cronJobs.js";

try {
  await checkDatabase();
  logger.info("MySQL connection established successfully.");

  // Initialize cron background jobs
  initCronJobs();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 CarShowroom Enterprise API running at http://localhost:${config.port}`);
    logger.info(`📚 Swagger Documentation UI: http://localhost:${config.port}/api/docs`);
    logger.info(`🤖 AI Provider: ${config.aiProvider} (${config.aiModel || "default model"})`);
    logger.info(`🌿 Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info("Received termination signal. Closing HTTP server...");
    server.close(() => {
      logger.info("HTTP server closed. Exiting process.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  logger.error("Cannot start backend server. Please check MySQL and .env settings.");
  logger.error(error.message);
  process.exit(1);
}
