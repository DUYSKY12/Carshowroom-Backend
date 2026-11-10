import * as favoriteService from "../services/favoriteService.js";

export async function addFavorite(req, res) {
  const result = await favoriteService.addFavorite(req.user.id, req.params.carId);
  res.status(201).json({
    success: true,
    message: result.message
  });
}

export async function removeFavorite(req, res) {
  const result = await favoriteService.removeFavorite(req.user.id, req.params.carId);
  res.json({
    success: true,
    message: result.message
  });
}

export async function listFavorites(req, res) {
  const result = await favoriteService.listFavorites(req.user.id, req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function checkFavorite(req, res) {
  const result = await favoriteService.checkFavorite(req.user.id, req.params.carId);
  res.json({
    success: true,
    data: result
  });
}
