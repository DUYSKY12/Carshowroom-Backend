import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkyCar API",
      version: "2.0.0",
      description: "API cho hệ thống showroom ô tô SkyCar. Bao gồm quản lý xe, đặt lịch lái thử, CRM, đơn hàng và báo cáo.",
      contact: { name: "SkyCar Team" }
    },
    servers: [{ url: "/api", description: "API Server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" }
          }
        },
        Car: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            brand: { type: "string" },
            model: { type: "string" },
            year: { type: "integer" },
            price: { type: "number" },
            fuel_type: { type: "string", enum: ["gasoline", "diesel", "electric", "hybrid", "other"] },
            transmission: { type: "string", enum: ["automatic", "manual", "other"] },
            body_type: { type: "string" },
            seats: { type: "integer" },
            mileage_km: { type: "integer" },
            color: { type: "string" },
            description: { type: "string" },
            image_url: { type: "string" },
            status: { type: "string", enum: ["available", "reserved", "sold", "hidden"] }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            full_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["customer", "sales", "admin"] },
            email_verified: { type: "boolean" }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
};

export const swaggerSpec = swaggerJsdoc(options);
