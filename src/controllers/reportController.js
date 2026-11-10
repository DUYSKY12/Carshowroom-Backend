import pool from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const dashboard = asyncHandler(async (req, res) => {
  // Inventory breakdown
  const [[inventory]] = await pool.query(`
    SELECT COUNT(*) AS totalCars,
      COALESCE(SUM(status='available'), 0) AS availableCars,
      COALESCE(SUM(status='reserved'), 0) AS reservedCars,
      COALESCE(SUM(status='sold'), 0) AS soldCars
    FROM cars
  `);

  // Order & Revenue metrics
  const [[orderStats]] = await pool.query(`
    SELECT COUNT(*) AS totalOrders,
      COALESCE(SUM(status='completed'), 0) AS completedOrders,
      COALESCE(SUM(status='deposit_paid'), 0) AS depositPaidOrders,
      COALESCE(SUM(status='cancelled'), 0) AS cancelledOrders,
      COALESCE(SUM(CASE WHEN status='completed' THEN total_price ELSE 0 END), 0) AS totalRevenue,
      COALESCE(SUM(deposit_amount), 0) AS totalDepositsCollected
    FROM orders
  `);

  // Booking statistics (last 30 days)
  const [[bookingStats]] = await pool.query(`
    SELECT COUNT(*) AS totalBookings,
      COALESCE(SUM(status='pending'), 0) AS pendingBookings,
      COALESCE(SUM(status='confirmed'), 0) AS confirmedBookings,
      COALESCE(SUM(status='completed'), 0) AS completedBookings,
      COALESCE(SUM(status='cancelled'), 0) AS cancelledBookings
    FROM bookings
    WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  `);

  // Lead conversion statistics (last 30 days)
  const [[leadStats]] = await pool.query(`
    SELECT COUNT(*) AS totalLeads,
      COALESCE(SUM(status='new'), 0) AS newLeads,
      COALESCE(SUM(status='qualified'), 0) AS qualifiedLeads,
      COALESCE(SUM(status='negotiating'), 0) AS negotiatingLeads,
      COALESCE(SUM(status='won'), 0) AS wonLeads,
      COALESCE(SUM(status='lost'), 0) AS lostLeads
    FROM leads
    WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  `);

  const conversionRate = leadStats.totalLeads > 0
    ? ((leadStats.wonLeads / leadStats.totalLeads) * 100).toFixed(1)
    : "0.0";

  // Top brands by available stock
  const [topBrands] = await pool.query(`
    SELECT brand, COUNT(*) AS count
    FROM cars WHERE status='available'
    GROUP BY brand ORDER BY count DESC LIMIT 6
  `);

  // Most popular cars (by views)
  const [topViewed] = await pool.query(`
    SELECT id, name, brand, model, price, view_count, image_url
    FROM cars WHERE status='available'
    ORDER BY view_count DESC LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      inventory,
      orders: { ...orderStats, conversionRate: `${conversionRate}%` },
      bookingStats,
      leadStats,
      topBrands,
      topViewed
    }
  });
});

export const revenueReport = asyncHandler(async (req, res) => {
  const [monthlyRevenue] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
           COUNT(*) AS totalOrders,
           SUM(total_price) AS revenue
    FROM orders
    WHERE status = 'completed' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  const [revenueByBrand] = await pool.query(`
    SELECT c.brand, COUNT(o.id) as carsSold, SUM(o.total_price) as totalRevenue
    FROM orders o JOIN cars c ON o.car_id = c.id
    WHERE o.status = 'completed'
    GROUP BY c.brand
    ORDER BY totalRevenue DESC
  `);

  res.json({
    success: true,
    data: {
      monthlyRevenue,
      revenueByBrand
    }
  });
});

export const inventoryReport = asyncHandler(async (req, res) => {
  const [byBodyType] = await pool.query(`
    SELECT COALESCE(body_type, 'Khác') as bodyType, COUNT(*) as count
    FROM cars WHERE status = 'available'
    GROUP BY body_type
  `);

  const [byFuelType] = await pool.query(`
    SELECT fuel_type as fuelType, COUNT(*) as count
    FROM cars WHERE status = 'available'
    GROUP BY fuel_type
  `);

  // Aging inventory (> 45 days)
  const [agingCars] = await pool.query(`
    SELECT id, name, brand, model, price, created_at,
           DATEDIFF(NOW(), created_at) as daysInStock
    FROM cars
    WHERE status = 'available' AND created_at <= DATE_SUB(NOW(), INTERVAL 45 DAY)
    ORDER BY daysInStock DESC
  `);

  res.json({
    success: true,
    data: {
      byBodyType,
      byFuelType,
      agingCars
    }
  });
});
