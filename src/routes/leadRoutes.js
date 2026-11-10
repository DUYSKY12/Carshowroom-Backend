import { Router } from "express";
import { createLead, listLeads, updateLead } from "../controllers/leadController.js";
import { authenticate, optionalAuthenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createLeadSchema, updateLeadSchema } from "../validators/leadValidator.js";

const router = Router();

router.post("/", optionalAuthenticate, validate(createLeadSchema), createLead);
router.get("/", authenticate, authorize("admin", "sales"), listLeads);
router.patch("/:id", authenticate, authorize("admin", "sales"), validate(updateLeadSchema), updateLead);

export default router;
