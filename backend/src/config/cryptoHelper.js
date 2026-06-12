import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "d6F3E0a51D9g2H4j8k3L1p5Q9w8E2r7t"; // Must be 32 bytes (256 bits)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export const encryptText = (text) => {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    // Return iv + encryptedText + authTag separated by colon
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return "";
  }
};

export const decryptText = (encryptedText) => {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Return plain text if it's not in encrypted format (legacy support)
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return "";
  }
};

export const hashText = (text) => {
  if (!text) return "";
  return crypto.createHash("sha256").update(text).digest("hex");
};
