import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(notificationController.listNotifications));
router.get("/unread-count", asyncHandler(notificationController.getUnreadCount));
router.patch("/read-all", asyncHandler(notificationController.markAllAsRead));
router.patch("/:id/read", asyncHandler(notificationController.markAsRead));

export default router;
