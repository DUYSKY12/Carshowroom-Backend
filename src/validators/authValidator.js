import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(120).trim(),
  email: z.string().email("Email không hợp lệ").max(190).trim().toLowerCase(),
  phone: z.string().min(8, "Số điện thoại không hợp lệ").max(30).optional().nullable(),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(128)
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").trim().toLowerCase(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu")
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Email không hợp lệ").trim().toLowerCase(),
  code: z.string().min(4, "Mã xác minh không hợp lệ")
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Email không hợp lệ").trim().toLowerCase()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").trim().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(128)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự").max(128)
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(120).trim().optional(),
  phone: z.string().min(8, "Số điện thoại tối thiểu 8 số").max(30).optional().nullable(),
  avatarUrl: z.string().url("URL ảnh không hợp lệ").optional().nullable()
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Vui lòng cung cấp Refresh Token")
});
