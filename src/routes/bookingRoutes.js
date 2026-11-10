import { Router } from "express";
import { createBooking, myBookings, allBookings, updateBooking, cancelBooking } from "../controllers/bookingController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBookingSchema, updateBookingSchema } from "../validators/bookingValidator.js";

const router = Router();
router.use(authenticate);

router.post("/", validate(createBookingSchema), createBooking);
router.get("/mine", myBookings);
router.patch("/:id/cancel", cancelBooking);
router.get("/", authorize("admin", "sales"), allBookings);
router.patch("/:id", authorize("admin", "sales"), validate(updateBookingSchema), updateBooking);

export default router;
