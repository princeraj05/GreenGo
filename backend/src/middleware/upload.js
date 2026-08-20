import multer from "multer";
import cloudinary from "cloudinary";
import CloudinaryStorage from "multer-storage-cloudinary";
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
  params: (req, file, cb) => {
    // Filename sanitization
    const cleanName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    cb(null, {
      folder: "greengo_uploads",
      format: "webp", // Convert format automatically for secure delivery
      public_id: `${Date.now()}_${cleanName}`
    });
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

const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const publicId = `${Date.now()}_${cleanName}`;
    const isImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.mimetype);

    if (isImage) {
      return {
        folder: "greengo_support_attachments",
        format: "webp",
        resource_type: "image",
        public_id: publicId
      };
    } else {
      return {
        folder: "greengo_support_attachments",
        resource_type: "raw",
        public_id: `${publicId}${ext}`
      };
    }
  }
});

const chatFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("File extension not supported. Supported extensions: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT."), false);
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("MIME type not supported."), false);
  }

  cb(null, true);
};

export const chatUpload = multer({
  storage: chatStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: chatFileFilter
});
