import nodemailer from "nodemailer";
import { config } from "../config/env.js";
import logger from "../config/logger.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });
      logger.info("Nodemailer SMTP transporter initialized");
    } else {
      logger.warn("SMTP credentials not provided. Emails will be logged to console instead of sending.");
    }
  }

  async sendMail({ to, subject, html, text }) {
    const mailOptions = {
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, "")
    };

    if (!this.transporter) {
      logger.info(`[Email Mock] To: ${to} | Subject: "${subject}"`);
      logger.debug(`[Email Mock Body]:\n${mailOptions.text}`);
      return { mock: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      // Don't crash caller if email fails in dev
      return { error: error.message };
    }
  }

  async sendVerificationEmail(to, fullName, code) {
    const verifyUrl = `${config.appUrl}/verify-email?code=${code}&email=${encodeURIComponent(to)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #e50914; margin: 0; font-size: 24px;">SkyCar</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333333;">Chào mừng ${fullName}!</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>SkyCar</strong>. Vui lòng sử dụng mã xác nhận bên dưới để hoàn tất xác minh tài khoản của bạn:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a1a; background: #f0f0f0; padding: 15px 30px; border-radius: 6px; border: 1px dashed #ccc;">
              ${code}
            </span>
          </div>
          <p style="text-align: center; color: #777;">Hoặc bấm vào nút bên dưới để xác nhận trực tiếp:</p>
          <div style="text-align: center; margin-top: 15px;">
            <a href="${verifyUrl}" style="background-color: #e50914; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Xác minh email ngay
            </a>
          </div>
          <p style="color: #999; font-size: 13px; margin-top: 30px; text-align: center;">
            Mã xác nhận này sẽ hết hạn trong vòng 24 giờ. Nếu bạn không tạo tài khoản, xin vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;
    return this.sendMail({
      to,
      subject: "Xác minh tài khoản SkyCar của bạn",
      html
    });
  }

  async sendPasswordResetEmail(to, fullName, resetToken) {
    const resetUrl = `${config.appUrl}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #e50914; margin: 0; font-size: 24px;">SkyCar</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333333;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">
            Xin chào <strong>${fullName}</strong>,<br>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SkyCar của bạn. Bấm vào nút bên dưới để tạo mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #e50914; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Nếu nút bấm không hoạt động, bạn có thể sao chép liên kết này vào trình duyệt:<br>
            <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 30px; text-align: center;">
            Liên kết này có hiệu lực trong vòng 60 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua thư này.
          </p>
        </div>
      </div>
    `;
    return this.sendMail({
      to,
      subject: "Yêu cầu đặt lại mật khẩu tài khoản SkyCar",
      html
    });
  }

  async sendBookingConfirmation(to, fullName, bookingDetails) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #e50914; margin: 0; font-size: 24px;">SkyCar</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #2e7d32;">Xác nhận đặt lịch lái thử thành công!</h2>
          <p style="color: #555555; font-size: 16px;">
            Xin chào <strong>${fullName}</strong>, chúng tôi đã ghi nhận lịch hẹn trải nghiệm xe của bạn:
          </p>
          <div style="background: #f4f7f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>Xe trải nghiệm:</strong> ${bookingDetails.carName}</p>
            <p style="margin: 6px 0;"><strong>Thời gian hẹn:</strong> ${new Date(bookingDetails.scheduledAt).toLocaleString("vi-VN")}</p>
            <p style="margin: 6px 0;"><strong>Số điện thoại:</strong> ${bookingDetails.phone}</p>
            <p style="margin: 6px 0;"><strong>Trạng thái:</strong> ${bookingDetails.status}</p>
          </div>
          <p style="color: #555; font-size: 14px;">Chuyên viên tư vấn của SkyCar sẽ liên hệ với bạn trước giờ hẹn 2 tiếng để hỗ trợ chu đáo nhất.</p>
        </div>
      </div>
    `;
    return this.sendMail({
      to,
      subject: `Xác nhận lịch lái thử xe ${bookingDetails.carName}`,
      html
    });
  }
}

export const emailService = new EmailService();
