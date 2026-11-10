import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createOrderSchema,
  updateOrderSchema,
  createPaymentSchema,
  checkCouponSchema
} from "../validators/orderValidator.js";

const router = Router();

// Public coupon endpoints
router.post(
  "/check-coupon",
  validate(checkCouponSchema),
  asyncHandler(orderController.checkCoupon)
);

router.get(
  "/coupons/available",
  asyncHandler(orderController.listAvailableCoupons)
);

// All subsequent order routes require authenticated user
router.use(authenticate);

// Customer endpoints
router.post(
  "/",
  validate(createOrderSchema),
  asyncHandler(orderController.createOrder)
);

router.get(
  "/mine",
  asyncHandler(orderController.listMyOrders)
);

router.get(
  "/:id",
  asyncHandler(orderController.getOrder)
);

// Admin & Sales management endpoints
router.get(
  "/",
  authorize("admin", "sales"),
  asyncHandler(orderController.listAllOrders)
);

router.patch(
  "/:id/status",
  authorize("admin", "sales"),
  validate(updateOrderSchema),
  asyncHandler(orderController.updateOrderStatus)
);

router.post(
  "/:id/payments",
  authorize("admin", "sales"),
  validate(createPaymentSchema),
  asyncHandler(orderController.recordPayment)
);

export default router;
