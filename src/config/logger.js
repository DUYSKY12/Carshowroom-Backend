import winston from "winston";
import { config } from "./env.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const prodFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return JSON.stringify({ timestamp, level, message: stack || message, ...meta });
});

const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
  ),
  defaultMeta: { service: "carshowroom-api" },
  transports: [
    new winston.transports.Console({
      format: combine(
        config.nodeEnv === "production" ? prodFormat : combine(colorize(), devFormat)
      )
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
      format: prodFormat
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
      format: prodFormat
    })
  ]
});

export default logger;
