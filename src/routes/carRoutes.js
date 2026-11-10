import { Router } from "express";
import * as carController from "../controllers/carController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadMultiple, handleUploadError } from "../middleware/upload.js";
import { createCarSchema, updateCarSchema, compareSchema } from "../validators/carValidator.js";

const router = Router();

// Public routes
router.get("/", asyncHandler(carController.listCars));
router.post("/compare", validate(compareSchema), asyncHandler(carController.compareCars));
router.get("/:id", asyncHandler(carController.getCar));
router.get("/:id/images", asyncHandler(carController.getImages));

// Protected routes (Sales & Admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "sales"),
  validate(createCarSchema),
  asyncHandler(carController.createCar)
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "sales"),
  validate(updateCarSchema),
  asyncHandler(carController.updateCar)
);

router.post(
  "/:id/images",
  authenticate,
  authorize("admin", "sales"),
  uploadMultiple,
  handleUploadError,
  asyncHandler(carController.uploadImages)
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("admin", "sales"),
  asyncHandler(carController.deleteImage)
);

router.patch(
  "/:id/images/:imageId/primary",
  authenticate,
  authorize("admin", "sales"),
  asyncHandler(carController.setPrimaryImage)
);

// Admin only route
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(carController.deleteCar)
);

export default router;
