import * as recommendService from "../services/ai/recommendService.js";
import * as chatService from "../services/ai/chatService.js";
import * as searchService from "../services/ai/searchService.js";
import * as priceEstimationService from "../services/ai/priceEstimationService.js";
import * as insightsService from "../services/ai/insightsService.js";

export async function recommend(req, res) {
  const userId = req.user ? req.user.id : null;
  const result = await recommendService.getCarRecommendations({ ...req.body, userId });
  res.json({
    success: true,
    data: result
  });
}

export async function chat(req, res) {
  const userId = req.user ? req.user.id : null;
  const sessionToken = req.headers["x-session-token"] || null;
  const result = await chatService.sendMessage({
    sessionId: req.body.sessionId,
    sessionToken,
    message: req.body.message,
    userId
  });
  res.json({
    success: true,
    data: result
  });
}

export async function getSessions(req, res) {
  const sessions = await chatService.getSessions(req.user.id);
  res.json({
    success: true,
    data: sessions
  });
}

export async function getSessionMessages(req, res) {
  const userId = req.user ? req.user.id : null;
  const result = await chatService.getSessionMessages(req.params.id, userId);
  res.json({
    success: true,
    data: result
  });
}

export async function deleteSession(req, res) {
  const userId = req.user ? req.user.id : null;
  const result = await chatService.deleteSession(req.params.id, userId);
  res.json({
    success: true,
    message: result.message
  });
}

export async function search(req, res) {
  const result = await searchService.searchCarsByNaturalLanguage(req.body.query);
  res.json({
    success: true,
    data: result
  });
}

export async function priceEstimate(req, res) {
  const result = await priceEstimationService.estimateCarPrice({
    brand: req.body.brand,
    model: req.body.model,
    year: req.body.year,
    mileageKm: req.body.mileage_km || req.body.mileageKm,
    condition: req.body.condition,
    fuelType: req.body.fuel_type || req.body.fuelType,
    transmission: req.body.transmission
  });
  res.json({
    success: true,
    data: result
  });
}

export async function getInsights(req, res) {
  const result = await insightsService.getAiMarketInsights();
  res.json({
    success: true,
    data: result
  });
}
