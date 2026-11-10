import * as adminService from "../services/adminService.js";

export async function listUsers(req, res) {
  const result = await adminService.listUsers(req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

export async function getUserById(req, res) {
  const user = await adminService.getUserById(req.params.id);
  res.json({
    success: true,
    data: user
  });
}

export async function updateUser(req, res) {
  const user = await adminService.updateUser(req.params.id, req.body, req.user, req);
  res.json({
    success: true,
    message: "Cập nhật người dùng thành công.",
    data: user
  });
}

export async function getActivityLogs(req, res) {
  const result = await adminService.getActivityLogs(req.query);
  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}
