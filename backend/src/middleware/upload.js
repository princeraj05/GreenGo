import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure cloudinary storage with sanitization and extensions restrictions
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Filename sanitization
    const cleanName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    return {
      folder: "greengo_uploads",
      format: "webp", // Convert format automatically for secure delivery
      public_id: `${Date.now()}_${cleanName}`
    };
  }
});

// File upload validation filter
const fileFilter = (req, file, cb) => {
  // MIME Type validation
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("MIME type validation failed. Executables or unsupported files are blocked."), false);
  }
  
  // Executable file block by extension check
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExtensions = [".exe", ".bat", ".sh", ".js", ".ts", ".html", ".php", ".bin"];
  if (blockedExtensions.includes(ext)) {
    return cb(new Error("Executable file uploads are strictly blocked."), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter
});
