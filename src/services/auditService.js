import pool from "../config/db.js";
import logger from "../config/logger.js";

/**
 * Log administrative or significant user actions into activity_logs
 */
export async function recordActivity({
  userId = null,
  action,
  entityType,
  entityId = null,
  oldValues = null,
  newValues = null,
  req = null
}) {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers["user-agent"] : null;

    await pool.execute(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress ? String(ipAddress).substring(0, 45) : null,
        userAgent ? String(userAgent).substring(0, 500) : null
      ]
    );
  } catch (err) {
    logger.error(`Failed to record activity log: ${err.message}`);
    // Non-blocking
  }
}
