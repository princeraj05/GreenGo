import jwt from "jsonwebtoken";

const maskToken = (token) => {
  if (!token) return "none";
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
};

export const protect = (req, res, next) => {

  const header = req.headers.authorization;
  console.log(`[AUTH DEBUG] Protected route ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH DEBUG] JWT received: ${header ? maskToken(header.replace("Bearer ", "")) : "none"}`);

  if (!header || !header.startsWith("Bearer ")) {
    console.log(`[AUTH ERROR] No bearer token provided for ${req.originalUrl} from origin ${req.headers.origin || 'none'}`);
    console.log("[AUTH DEBUG] Auth middleware response status: 401");
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH DEBUG] JWT verification success:", decoded);
    req.user = decoded;
    console.log("[AUTH DEBUG] User extracted from token:", req.user);
    next();
  } catch (err) {
    console.log(`[AUTH ERROR] Invalid token for ${req.originalUrl} from origin ${req.headers.origin || 'none'}: ${err.message}`);
    console.log("[AUTH DEBUG] JWT verification failure:", err.message);
    console.log("[AUTH DEBUG] Auth middleware response status: 401");
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

export const optionalProtect = (req, res, next) => {
  const header = req.headers.authorization;
  console.log(`[AUTH DEBUG] Optional protected route ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH DEBUG] Optional JWT received: ${header ? maskToken(header.replace("Bearer ", "")) : "none"}`);

  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[AUTH DEBUG] Optional JWT verification success:", decoded);
      req.user = decoded;
    } catch (err) {
      console.log("[AUTH DEBUG] Optional JWT verification failure:", err.message);
    }
  }
  next();
};
