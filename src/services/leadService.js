import pool from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import { recordActivity } from "./auditService.js";

const statuses = ["new", "contacted", "qualified", "negotiating", "won", "lost"];

export async function createLead(data, user = null, req = null) {
  const customerName = user?.full_name || data.customerName || data.customer_name;
  const email = data.email || user?.email || null;
  const phone = (data.phone || user?.phone || "").trim();
  const carId = data.carId || data.car_id || null;
  const budgetMin = data.budgetMin ?? data.budget_min ?? null;
  const budgetMax = data.budgetMax ?? data.budget_max ?? null;
  const purpose = data.purpose || data.notes || null;
  const source = data.source || "website";
  const notes = data.notes || data.purpose || null;

  if (typeof customerName !== "string" || customerName.trim().length < 2 || phone.length < 8) {
    throw new HttpError(400, "Vui lòng cung cấp họ tên và số điện thoại hợp lệ (ít nhất 8 số).");
  }

  const [result] = await pool.execute(
    `INSERT INTO leads (customer_id, car_id, customer_name, email, phone, budget_min,
      budget_max, purpose, source, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user?.id || null, carId, customerName.trim(), email ? email.trim() : null,
      phone, budgetMin, budgetMax, purpose, source, notes
    ]
  );

  const leadId = result.insertId;

  await recordActivity({
    userId: user?.id || null,
    action: "create_lead",
    entityType: "lead",
    entityId: leadId,
    newValues: { customerName, phone, carId },
    req
  });

  return { id: leadId, status: "new" };
}

export async function listLeads(query = {}) {
  const { page, limit, offset } = getPaginationParams(query, 20);
  const where = [];
  const params = [];

  if (query.status && query.status !== "all" && query.status !== "undefined" && query.status !== "") {
    if (!statuses.includes(query.status)) throw new HttpError(400, "Trạng thái khách hàng tiềm năng không hợp lệ.");
    where.push("l.status = ?");
    params.push(query.status);
  }

  if (query.assignedTo && query.assignedTo !== "undefined") {
    where.push("l.assigned_to = ?");
    params.push(query.assignedTo);
  }

  if (query.search) {
    where.push("(l.customer_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)");
    const term = `%${query.search.trim()}%`;
    params.push(term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM leads l ${whereSql}`,
    params
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.execute(
    `SELECT l.*, c.name AS car_name, c.brand AS car_brand, u.full_name AS assignee_name
     FROM leads l
     LEFT JOIN cars c ON c.id = l.car_id
     LEFT JOIN users u ON u.id = l.assigned_to
     ${whereSql}
     ORDER BY l.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows,
    meta: buildPaginationMeta(page, limit, total)
  };
}

export async function updateLead(id, data, staffUser = null, req = null) {
  if (!statuses.includes(data.status)) throw new HttpError(400, "Trạng thái khách hàng tiềm năng không hợp lệ.");

  const [existing] = await pool.execute("SELECT id, status, assigned_to FROM leads WHERE id = ? LIMIT 1", [id]);
  if (!existing.length) throw new HttpError(404, "Không tìm thấy khách hàng tiềm năng.");

  const current = existing[0];
  const assignedTo = data.assignedTo !== undefined ? data.assignedTo : (data.assigned_to !== undefined ? data.assigned_to : current.assigned_to);

  const [result] = await pool.execute(
    "UPDATE leads SET status = ?, assigned_to = ?, notes = ? WHERE id = ?",
    [data.status, assignedTo, data.notes || null, id]
  );

  if (!result.affectedRows) throw new HttpError(404, "Không tìm thấy khách hàng tiềm năng.");

  if (staffUser) {
    await recordActivity({
      userId: staffUser.id,
      action: "update_lead",
      entityType: "lead",
      entityId: id,
      oldValues: { status: current.status, assignedTo: current.assigned_to },
      newValues: { status: data.status, assignedTo },
      req
    });
  }

  return { id: Number(id), status: data.status };
}
