import * as notificationService from "../services/notificationService.js";

export async function listNotifications(req, res) {
  const result = await notificationService.listUserNotifications(req.user.id, req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function markAsRead(req, res) {
  const result = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json({
    success: true,
    message: result.message
  });
}

export async function markAllAsRead(req, res) {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.json({
    success: true,
    message: result.message
  });
}

export async function getUnreadCount(req, res) {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.json({
    success: true,
    data: result
  });
}
