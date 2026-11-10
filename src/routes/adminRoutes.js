import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authenticated Admin
router.use(authenticate, authorize("admin"));

router.get("/users", asyncHandler(adminController.listUsers));
router.get("/users/:id", asyncHandler(adminController.getUserById));
router.patch("/users/:id", asyncHandler(adminController.updateUser));
router.get("/logs", asyncHandler(adminController.getActivityLogs));

export default router;
