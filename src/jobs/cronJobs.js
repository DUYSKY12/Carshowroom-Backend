import cron from "node-cron";
import pool from "../config/db.js";
import logger from "../config/logger.js";

/**
 * Initialize background scheduled jobs
 */
export function initCronJobs() {
  // Job 1: Clean expired auth tokens every midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("[Cron] Running expired tokens cleanup...");
      const [tokenResult] = await pool.execute(
        "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL"
      );
      const [resetResult] = await pool.execute(
        "DELETE FROM password_resets WHERE expires_at < NOW() OR used_at IS NOT NULL"
      );
      const [verifyResult] = await pool.execute(
        "DELETE FROM email_verifications WHERE expires_at < NOW() AND verified_at IS NULL"
      );
      logger.info(
        `[Cron] Cleaned ${tokenResult.affectedRows} refresh tokens, ${resetResult.affectedRows} resets, ${verifyResult.affectedRows} verifications`
      );
    } catch (err) {
      logger.error(`[Cron Token Cleanup Error]: ${err.message}`);
    }
  });

  // Job 2: Check overdue pending bookings every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const [bookingResult] = await pool.execute(
        `UPDATE bookings
         SET status = 'no_show', staff_note = 'Hệ thống tự động đánh dấu do quá giờ hẹn không xác nhận'
         WHERE status = 'pending' AND scheduled_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
      );
      if (bookingResult.affectedRows > 0) {
        logger.info(`[Cron] Marked ${bookingResult.affectedRows} overdue bookings as no_show`);
      }
    } catch (err) {
      logger.error(`[Cron Booking Check Error]: ${err.message}`);
    }
  });

  logger.info("Cron background jobs scheduled successfully.");
}
