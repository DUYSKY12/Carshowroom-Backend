import pool from "../../config/db.js";
import { getAiProvider } from "./aiProviderFactory.js";
import { HttpError } from "../../utils/httpError.js";
import logger from "../../config/logger.js";

/**
 * AI Chatbot for car showroom consultation with session and history persistence
 */
export async function sendMessage({ sessionId, sessionToken, message, userId = null }) {
  if (!message || !message.trim()) {
    throw new HttpError(400, "Nội dung tin nhắn không được để trống.");
  }

  const provider = getAiProvider();
  let activeSessionId = sessionId;

  // Find or create session
  if (!activeSessionId) {
    const title = message.trim().slice(0, 50);
    const [sessResult] = await pool.execute(
      `INSERT INTO chat_sessions (user_id, session_token, title)
       VALUES (?, ?, ?)`,
      [userId, sessionToken || null, title]
    );
    activeSessionId = sessResult.insertId;
  } else {
    // Verify session ownership if authenticated
    const [sess] = await pool.execute(
      "SELECT id, user_id FROM chat_sessions WHERE id = ? LIMIT 1",
      [activeSessionId]
    );
    if (!sess.length) {
      throw new HttpError(404, "Không tìm thấy phiên trò chuyện.");
    }
  }

  // Save user message to database
  await pool.execute(
    `INSERT INTO chat_messages (session_id, role, content)
     VALUES (?, 'user', ?)`,
    [activeSessionId, message.trim()]
  );

  // Retrieve chat history (up to last 10 messages for context)
  const [historyRows] = await pool.execute(
    `SELECT role, content FROM chat_messages
     WHERE session_id = ?
     ORDER BY id ASC
     LIMIT 12`,
    [activeSessionId]
  );

  // Retrieve current active car inventory summary for grounding (RAG context)
  const [inventory] = await pool.execute(
    `SELECT id, name, brand, model, year, price, body_type, seats, fuel_type, status
     FROM cars WHERE status = 'available'
     ORDER BY view_count DESC
     LIMIT 15`
  );

  const inventorySummary = inventory.map(c =>
    `- [ID: ${c.id}] ${c.name} (${c.year}): ${Number(c.price).toLocaleString("vi-VN")} đ | ${c.seats || 5} chỗ | ${c.body_type || "xe"} | Nhiên liệu: ${c.fuel_type}`
  ).join("\n");

  const systemInstruction = `
Bạn là "CarShowroom AI Advisor" — Trợ lý tư vấn bán xe thông minh, tận tâm và chuyên nghiệp của Showroom Ô Tô CarShowroom tại Việt Nam.

DỮ LIỆU KHO XE ĐANG CÓ SẴN TẠI SHOWROOM:
${inventorySummary}

HƯỚNG DẪN CỦA BẠN:
1. Bạn trả lời khách hàng bằng tiếng Việt lịch sự, thân thiện, mang tính tư vấn chuyên môn cao.
2. Dựa vào kho xe thực tế ở trên để tư vấn, gợi ý các mẫu xe phù hợp nhất với nhu cầu của khách. Không bịa đặt các xe showroom không có.
3. Khi tư vấn xe, hãy đề cập: Tên xe, Giá bán, Ưu điểm nổi bật (không gian, tiết kiệm nhiên liệu, trang bị an toàn).
4. Nếu khách hàng tỏ ý thích một mẫu xe nào đó, hãy khéo léo mời họ "Đặt lịch lái thử" hoặc để lại số điện thoại để chuyên viên tư vấn chi tiết hơn.
5. Luôn giữ thái độ tôn trọng, hỗ trợ và súc tích.
`;

  let assistantReply = "";
  try {
    assistantReply = await provider.chat(historyRows, systemInstruction);
  } catch (err) {
    logger.error(`AI Chat failed: ${err.message}`);
    assistantReply = "Xin lỗi quý khách, hệ thống tư vấn AI đang bận trong giây lát. Quý khách có thể xem trực tiếp danh sách xe tại showroom hoặc gọi hotline để được hỗ trợ nhanh nhất!";
  }

  // Save assistant reply to database
  await pool.execute(
    `INSERT INTO chat_messages (session_id, role, content)
     VALUES (?, 'assistant', ?)`,
    [activeSessionId, assistantReply]
  );

  // Touch session updated_at
  await pool.execute("UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?", [activeSessionId]);

  return {
    sessionId: activeSessionId,
    reply: assistantReply
  };
}

/**
 * Get all chat sessions of a user
 */
export async function getSessions(userId) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            (SELECT content FROM chat_messages WHERE session_id = s.id ORDER BY id DESC LIMIT 1) as last_message
     FROM chat_sessions s
     WHERE s.user_id = ?
     ORDER BY s.updated_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Get message history of a specific session
 */
export async function getSessionMessages(sessionId, userId = null) {
  const [sess] = await pool.execute(
    "SELECT id, user_id, title, created_at FROM chat_sessions WHERE id = ? LIMIT 1",
    [sessionId]
  );
  if (!sess.length) {
    throw new HttpError(404, "Không tìm thấy phiên trò chuyện.");
  }

  if (userId && sess[0].user_id && sess[0].user_id !== userId) {
    throw new HttpError(403, "Bạn không có quyền truy cập phiên này.");
  }

  const [messages] = await pool.execute(
    "SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC",
    [sessionId]
  );

  return {
    session: sess[0],
    messages
  };
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId, userId = null) {
  const [sess] = await pool.execute(
    "SELECT id, user_id FROM chat_sessions WHERE id = ? LIMIT 1",
    [sessionId]
  );
  if (!sess.length) {
    throw new HttpError(404, "Không tìm thấy phiên trò chuyện.");
  }

  if (userId && sess[0].user_id && sess[0].user_id !== userId) {
    throw new HttpError(403, "Bạn không có quyền xóa phiên này.");
  }

  await pool.execute("DELETE FROM chat_sessions WHERE id = ?", [sessionId]);
  return { success: true, message: "Đã xóa phiên trò chuyện." };
}
