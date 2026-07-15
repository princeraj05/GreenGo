import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import dns from "dns";

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

import connectDB from "./config/db.js";
import bannerRoutes from "./routes/bannerRoutes.js";

// ROUTES
import userRoutes from "./routes/userRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminContactRoutes from "./routes/adminContactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.set("etag", false);

/* ================= CORS ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://byte-bite-ten.vercel.app",
  "https://byte-bite-dd1g7omzo-princes-projects-d7be7534.vercel.app",
  "https://green-go.in",
  "https://www.green-go.in",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  "com.bytebite.fooddelivery://localhost",
  "com.bytebite.fooddelivery://",
  "ionic://localhost",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = 
      allowedOrigins.includes(origin) || 
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      origin.includes("green-go.in") ||
      origin.includes("localhost");
      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
}));

// Request Logging Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const method = req.method;
  const url = req.originalUrl;
  res.on("finish", () => {
    console.log(`[REQUEST LOG] ${method} ${url} | Origin: ${origin || "none"} | Status: ${res.statusCode}`);
  });
  next();
});

/* ================= MIDDLEWARE ================= */

app.use(express.json());

app.use((req, res, next) => {
  // Security Headers
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* ================= STATIC FILES ================= */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ================= ROUTES ================= */

app.use("/api/users", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/contacts", adminContactRoutes);

app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/banners", bannerRoutes);

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    success: false,
    message: err.message,
  });
});

/* ================= SERVER ================= */
import { runDatabaseBackup } from "./services/backupService.js";
import { runPrivacyCleanupJob } from "./services/privacyService.js";
import { runPaymentCleanupJob } from "./services/paymentCleanupService.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Run tasks immediately on startup, then periodically
  setTimeout(runDatabaseBackup, 5000);
  setTimeout(runPrivacyCleanupJob, 8000);
  setTimeout(runPaymentCleanupJob, 10000);
  
  setInterval(runDatabaseBackup, 24 * 60 * 60 * 1000);
  setInterval(runPrivacyCleanupJob, 24 * 60 * 60 * 1000);
  setInterval(runPaymentCleanupJob, 60 * 60 * 1000); // Run cleanup every hour
});
