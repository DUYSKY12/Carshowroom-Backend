import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema
} from "../validators/authValidator.js";

const router = Router();

// Public auth routes
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);

router.post(
  "/logout",
  asyncHandler(authController.logout)
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail)
);

router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(authController.resendVerification)
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

// Protected routes (requires valid access token)
router.get(
  "/me",
  authenticate,
  asyncHandler(authController.getProfile)
);

router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);

router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
