import { Router } from "express";
import { dashboard, revenueReport, inventoryReport } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Reports are restricted to Admin & Sales
router.use(authenticate, authorize("admin", "sales"));

router.get("/dashboard", dashboard);
router.get("/revenue", revenueReport);
router.get("/inventory", inventoryReport);

export default router;
