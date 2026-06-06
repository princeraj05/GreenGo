import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    console.log(`[AUTH ERROR] No bearer token provided for ${req.originalUrl} from origin ${req.headers.origin || 'none'}`);
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(`[AUTH ERROR] Invalid token for ${req.originalUrl} from origin ${req.headers.origin || 'none'}: ${err.message}`);
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

export const optionalProtect = (req, res, next) => {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignored for optional protect
    }
  }
  next();
};