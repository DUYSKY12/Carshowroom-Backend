import { Router } from "express";
import * as reviewController from "../controllers/reviewController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/orderValidator.js";

const router = Router();

// Public: list reviews for a car
router.get("/car/:carId", asyncHandler(reviewController.listCarReviews));

// Protected: submit review for a car
router.post(
  "/car/:carId",
  authenticate,
  validate(createReviewSchema),
  asyncHandler(reviewController.createReview)
);

// Admin/Sales: view all reviews
router.get(
  "/",
  authenticate,
  authorize("admin", "sales"),
  asyncHandler(reviewController.listAllReviews)
);

// Admin/Sales: approve/reject review
router.patch(
  "/:id/approve",
  authenticate,
  authorize("admin", "sales"),
  asyncHandler(reviewController.approveReview)
);

// Protected: delete review (author or admin)
router.delete(
  "/:id",
  authenticate,
  asyncHandler(reviewController.deleteReview)
);

export default router;
