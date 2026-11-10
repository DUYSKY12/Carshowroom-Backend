import * as authService from "../services/authService.js";

export async function register(req, res) {
  const result = await authService.register(req.body, req);
  res.status(201).json({
    success: true,
    message: "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để nhận mã xác minh.",
    data: result
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body, req);
  res.json({
    success: true,
    message: "Đăng nhập thành công.",
    data: result
  });
}

export async function refreshToken(req, res) {
  const refreshTokenValue = req.body.refreshToken || req.headers["x-refresh-token"];
  const result = await authService.refreshSession(refreshTokenValue);
  res.json({
    success: true,
    message: "Làm mới phiên thành công.",
    data: result
  });
}

export async function logout(req, res) {
  const refreshTokenValue = req.body.refreshToken || req.headers["x-refresh-token"];
  const result = await authService.logout(refreshTokenValue);
  res.json({
    success: true,
    message: result.message
  });
}

export async function verifyEmail(req, res) {
  const { email, code } = req.body;
  const result = await authService.verifyEmail(email, code);
  res.json({
    success: true,
    message: result.message
  });
}

export async function resendVerification(req, res) {
  const { email } = req.body;
  const result = await authService.resendVerification(email);
  res.json({
    success: true,
    message: result.message
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.json({
    success: true,
    message: result.message
  });
}

export async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body);
  res.json({
    success: true,
    message: result.message
  });
}

export async function getProfile(req, res) {
  const user = await authService.getProfile(req.user.id);
  res.json({
    success: true,
    data: user
  });
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({
    success: true,
    message: "Cập nhật thông tin thành công.",
    data: user
  });
}

export async function changePassword(req, res) {
  const result = await authService.changePassword(req.user.id, req.body);
  res.json({
    success: true,
    message: result.message
  });
}
