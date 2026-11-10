import * as leadService from "../services/leadService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createLead = asyncHandler(async (req, res) => {
  const result = await leadService.createLead(req.body, req.user || null, req);
  res.status(201).json({ success: true, data: result });
});

export const listLeads = asyncHandler(async (req, res) => {
  const result = await leadService.listLeads(req.query);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const updateLead = asyncHandler(async (req, res) => {
  const result = await leadService.updateLead(req.params.id, req.body, req.user || null, req);
  res.json({ success: true, data: result });
});
