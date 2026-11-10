import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(favoriteController.listFavorites));
router.get("/:carId/check", asyncHandler(favoriteController.checkFavorite));
router.post("/:carId", asyncHandler(favoriteController.addFavorite));
router.delete("/:carId", asyncHandler(favoriteController.removeFavorite));

export default router;
