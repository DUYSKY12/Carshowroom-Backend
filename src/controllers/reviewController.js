import * as reviewService from "../services/reviewService.js";

export async function createReview(req, res) {
  const result = await reviewService.createReview(req.user.id, req.params.carId, req.body);
  res.status(201).json({
    success: true,
    message: "Gửi đánh giá thành công.",
    data: result
  });
}

export async function listCarReviews(req, res) {
  const result = await reviewService.listCarReviews(req.params.carId, req.query);
  res.json({
    success: true,
    data: result.data,
    summary: result.summary,
    meta: result.meta
  });
}

export async function listAllReviews(req, res) {
  const result = await reviewService.listAllReviews(req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function approveReview(req, res) {
  const isApproved = req.body.isApproved !== undefined ? req.body.isApproved : true;
  const result = await reviewService.approveReview(req.params.id, isApproved);
  res.json({
    success: true,
    message: result.message
  });
}

export async function deleteReview(req, res) {
  const result = await reviewService.deleteReview(req.params.id, req.user);
  res.json({
    success: true,
    message: result.message
  });
}
