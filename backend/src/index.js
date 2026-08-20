import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import dns from "dns";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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
import { protect } from "./middleware/authMiddleware.js";
import { createRazorpayOrderDirect, verifyRazorpayPaymentDirect } from "./controllers/paymentController.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import Contact from "./models/Contact.js";

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

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

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
app.post("/api/create-order", protect, createRazorpayOrderDirect);
app.post("/api/verify-payment", protect, verifyRazorpayPaymentDirect);
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

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
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
  }
});

// Attach io to express app
app.set("io", io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    console.log("[Socket] Connection rejected: No token provided");
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET123");
    socket.user = decoded;
    next();
  } catch (err) {
    console.log("[Socket] Connection rejected: Invalid token");
    return next(new Error("Authentication error: Invalid token"));
  }
});

// Global tracking for admin presence
let wasAdminOnline = false;

const checkAdminPresence = () => {
  let adminCount = 0;
  for (const [id, s] of io.of("/").sockets) {
    if (s.user && s.user.role === "admin") {
      adminCount++;
    }
  }
  return adminCount > 0;
};

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: user=${socket.user.id || socket.user._id}, role=${socket.user.role}`);

  // User joins their own room
  socket.join(`user:${socket.user.id || socket.user._id}`);

  // If admin, join "admins" room
  if (socket.user.role === "admin") {
    socket.join("admins");
    console.log(`[Socket] Admin joined admins room: user=${socket.user.id || socket.user._id}`);
  }

  // Emit current admin presence to newly connected socket
  socket.emit("support:admin-presence", { online: checkAdminPresence() });

  // Listen for admin presence requests
  socket.on("support:get-admin-presence", () => {
    socket.emit("support:admin-presence", { online: checkAdminPresence() });
  });

  // If this connection makes admin presence online, broadcast it
  if (socket.user.role === "admin") {
    const isOnline = checkAdminPresence();
    if (isOnline !== wasAdminOnline) {
      wasAdminOnline = isOnline;
      io.emit("support:admin-presence", { online: isOnline });
    }
  }

  // Delivery Catch-up logic on connection
  const userId = socket.user.id || socket.user._id;
  const userRole = socket.user.role;

  if (userRole === "customer") {
    Contact.find({ uid: userId })
      .then(async (contacts) => {
        for (const contact of contacts) {
          let docUpdated = false;
          if (contact.replies && contact.replies.length > 0) {
            contact.replies.forEach((r) => {
              if (r.status === "sent") {
                r.status = "delivered";
                r.deliveredAt = new Date();
                docUpdated = true;
                
                // Emit delivered status to admins
                io.to("admins").emit("support:delivered-status", {
                  messageId: r._id,
                  conversationKey: String(userId).toLowerCase(),
                  messageType: "admin-reply"
                });
                // Emit to self user room to keep multiple tabs in sync
                socket.emit("support:delivered-status", {
                  messageId: r._id,
                  conversationKey: String(userId).toLowerCase(),
                  messageType: "admin-reply"
                });
              }
            });
          }
          if (docUpdated) {
            await contact.save();
          }
        }
      })
      .catch((err) => console.error("[Socket] Catch-up delivery customer failed:", err));
  } else if (userRole === "admin") {
    Contact.find({ messageStatus: "sent" })
      .then(async (contacts) => {
        for (const contact of contacts) {
          contact.messageStatus = "delivered";
          contact.deliveredAt = new Date();
          await contact.save();

          const clientKey = String(contact.uid || contact.email || contact._id).toLowerCase();
          // Emit delivered status to sender/customer
          if (contact.uid) {
            io.to(`user:${contact.uid}`).emit("support:delivered-status", {
              messageId: contact._id,
              conversationKey: clientKey,
              messageType: "user-message"
            });
          }
          // Emit to admins
          io.to("admins").emit("support:delivered-status", {
            messageId: contact._id,
            conversationKey: clientKey,
            messageType: "user-message"
          });
        }
      })
      .catch((err) => console.error("[Socket] Catch-up delivery admin failed:", err));
  }

  // Socket delivery marking
  socket.on("support:mark-as-delivered", async (data) => {
    try {
      const { messageId, conversationKey, messageType } = data;
      if (!messageId) return;

      const currentUserId = socket.user.id || socket.user._id;
      const currentUserRole = socket.user.role;

      if (messageType === "user-message" && currentUserRole === "admin") {
        const contact = await Contact.findById(messageId);
        if (!contact) return;

        if (contact.messageStatus === "sent") {
          contact.messageStatus = "delivered";
          contact.deliveredAt = new Date();
          await contact.save();

          const clientKey = String(contact.uid || contact.email || contact._id).toLowerCase();
          if (contact.uid) {
            io.to(`user:${contact.uid}`).emit("support:delivered-status", {
              messageId: contact._id,
              conversationKey: clientKey,
              messageType: "user-message"
            });
          }
          io.to("admins").emit("support:delivered-status", {
            messageId: contact._id,
            conversationKey: clientKey,
            messageType: "user-message"
          });
        }
      } else if (messageType === "admin-reply" && currentUserRole === "customer") {
        const contact = await Contact.findOne({ "replies._id": messageId });
        if (!contact) return;

        if (String(contact.uid) !== String(currentUserId)) return;

        const reply = contact.replies.id(messageId);
        if (reply && reply.status === "sent") {
          reply.status = "delivered";
          reply.deliveredAt = new Date();
          await contact.save();

          const clientKey = String(currentUserId).toLowerCase();
          io.to("admins").emit("support:delivered-status", {
            messageId: reply._id,
            conversationKey: clientKey,
            messageType: "admin-reply"
          });
          socket.emit("support:delivered-status", {
            messageId: reply._id,
            conversationKey: clientKey,
            messageType: "admin-reply"
          });
        }
      }
    } catch (err) {
      console.error("[Socket] support:mark-as-delivered error:", err);
    }
  });

  // Socket read marking
  socket.on("support:mark-as-read", async (data) => {
    try {
      const { messageId, conversationKey, messageType, readBy } = data;
      if (!messageId) return;

      const currentUserId = socket.user.id || socket.user._id;
      const currentUserRole = socket.user.role;

      if (readBy === "admin" && currentUserRole === "admin" && messageType === "user-message") {
        const contact = await Contact.findById(messageId);
        if (!contact) return;

        if (contact.messageStatus === "read") return;

        contact.messageStatus = "read";
        contact.read = true;
        contact.readAt = new Date();
        if (!contact.deliveredAt) {
          contact.deliveredAt = new Date();
        }
        await contact.save();

        const clientKey = String(contact.uid || contact.email || contact._id).toLowerCase();
        if (contact.uid) {
          io.to(`user:${contact.uid}`).emit("support:read-status", {
            messageId: contact._id,
            conversationKey: clientKey,
            messageType: "user-message",
            readBy: "admin",
            readAt: contact.readAt
          });
        }
        io.to("admins").emit("support:read-status", {
          messageId: contact._id,
          conversationKey: clientKey,
          messageType: "user-message",
          readBy: "admin",
          readAt: contact.readAt
        });
      } else if (readBy === "user" && currentUserRole === "customer" && messageType === "admin-reply") {
        const contact = await Contact.findOne({ "replies._id": messageId });
        if (!contact) return;

        if (String(contact.uid) !== String(currentUserId)) return;

        const reply = contact.replies.id(messageId);
        if (!reply) return;

        if (reply.status === "read") return;

        reply.status = "read";
        reply.read = true;
        reply.readAt = new Date();
        contact.replyRead = true;
        if (!reply.deliveredAt) {
          reply.deliveredAt = new Date();
        }
        await contact.save();

        const clientKey = String(currentUserId).toLowerCase();
        io.to("admins").emit("support:read-status", {
          messageId: reply._id,
          conversationKey: clientKey,
          messageType: "admin-reply",
          readBy: "user",
          readAt: reply.readAt
        });
        socket.emit("support:read-status", {
          messageId: reply._id,
          conversationKey: clientKey,
          messageType: "admin-reply",
          readBy: "user",
          readAt: reply.readAt
        });
      }
    } catch (err) {
      console.error("[Socket] support:mark-as-read error:", err);
    }
  });

  socket.on("support:typing", (data) => {
    if (socket.user.role === "admin") {
      const { targetUserId, typing } = data;
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("support:typing", { typing });
      }
    } else {
      const { typing } = data;
      io.to("admins").emit("support:typing", { userId: socket.user.id || socket.user._id, typing });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: user=${socket.user.id || socket.user._id}`);

    if (socket.user.role === "admin") {
      // Grace period of 1s to prevent flickering
      setTimeout(() => {
        const isOnline = checkAdminPresence();
        if (isOnline !== wasAdminOnline) {
          wasAdminOnline = isOnline;
          io.emit("support:admin-presence", { online: isOnline });
        }
      }, 1000);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Run tasks immediately on startup, then periodically
  setTimeout(runDatabaseBackup, 5000);
  setTimeout(runPrivacyCleanupJob, 8000);
  setTimeout(runPaymentCleanupJob, 10000);
  
  setInterval(runDatabaseBackup, 24 * 60 * 60 * 1000);
  setInterval(runPrivacyCleanupJob, 24 * 60 * 60 * 1000);
  setInterval(runPaymentCleanupJob, 60 * 60 * 1000); // Run cleanup every hour
});
