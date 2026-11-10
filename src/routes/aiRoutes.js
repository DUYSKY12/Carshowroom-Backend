import { Router } from "express";
import * as aiController from "../controllers/aiController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, optionalAuthenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
  aiRecommendSchema,
  aiChatSchema,
  aiSearchSchema,
  aiPriceEstimateSchema
} from "../validators/aiValidator.js";

const router = Router();

// Recommendation
router.post(
  "/recommend",
  optionalAuthenticate,
  validate(aiRecommendSchema),
  asyncHandler(aiController.recommend)
);

// Conversational Chatbot
router.post(
  "/chat",
  aiLimiter,
  optionalAuthenticate,
  validate(aiChatSchema),
  asyncHandler(aiController.chat)
);

router.get(
  "/chat/sessions",
  authenticate,
  asyncHandler(aiController.getSessions)
);

router.get(
  "/chat/sessions/:id",
  optionalAuthenticate,
  asyncHandler(aiController.getSessionMessages)
);

router.delete(
  "/chat/sessions/:id",
  authenticate,
  asyncHandler(aiController.deleteSession)
);

// Natural Language Smart Search
router.post(
  "/search",
  validate(aiSearchSchema),
  asyncHandler(aiController.search)
);

// Price Estimation / Valuation
router.post(
  "/price-estimate",
  validate(aiPriceEstimateSchema),
  asyncHandler(aiController.priceEstimate)
);

// Business Insights (Admin & Sales only)
router.get(
  "/insights",
  authenticate,
  authorize("admin", "sales"),
  asyncHandler(aiController.getInsights)
);

export default router;
