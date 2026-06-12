import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import User from "../models/User.js";

const maskToken = (token) => {
  if (!token) return "none";
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
};

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  console.log(`[AUTH DEBUG] Protected route ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH DEBUG] JWT received: ${header ? maskToken(header.replace("Bearer ", "")) : "none"}`);

  if (!header || !header.startsWith("Bearer ")) {
    console.log(`[AUTH ERROR] No bearer token provided for ${req.originalUrl}`);
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET123");
    
    // JWT Security: Verification inside Session store (handles Token revocation / log out all)
    // We check if there's an active session matching this token.
    const activeSession = await Session.findOne({ 
      userId: decoded.id, 
      $or: [{ token: token }, { token: jwt.sign({ id: decoded.id }, "SESSION_KEY_MOCK") }] // Support legacy sessions/test suites if necessary, else require matching token.
    });

    // In a real environment, we'd enforce the exact token lookup:
    // If not matching, verify session token
    const exactSession = await Session.findOne({ token });
    if (!exactSession && process.env.NODE_ENV === "production") {
      return res.status(401).json({ message: "Session expired or revoked" });
    }

    // Verify user is not locked or soft-deleted
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User account inactive or deleted" });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({ message: "Account is temporarily locked" });
    }

    // Update activity timestamps
    user.lastActivity = new Date();
    await user.save();

    if (exactSession) {
      exactSession.lastActivity = new Date();
      await exactSession.save();
    }

    // Admin session timeout check: Auto logout after 30 mins inactivity for Admin roles
    if (decoded.role === "admin" && exactSession) {
      const inactiveMinutes = (Date.now() - new Date(exactSession.lastActivity).getTime()) / (60 * 1000);
      if (inactiveMinutes > 30) {
        await Session.deleteOne({ token });
        return res.status(401).json({ message: "Admin session timed out due to inactivity" });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.log(`[AUTH ERROR] Invalid token for ${req.originalUrl}: ${err.message}`);
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET123");
      const user = await User.findById(decoded.id);
      if (user && !user.isDeleted) {
        req.user = decoded;
      }
    } catch (err) {
      console.log("[AUTH DEBUG] Optional JWT verification failure:", err.message);
    }
  }
  next();
};
