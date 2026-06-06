import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import admin from "../config/firebase.js";
import crypto from "crypto";
import { sendEmail } from "../services/emailService.js";

/* ================= REGISTER ================= */

export const registerUser = async (req, res) => {
  try {

    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    res.json({
      success: true,
      message: "Registration successful"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= LOGIN ================= */

export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[AUTH ERROR] User login failed: User not found (${email})`);
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`[AUTH ERROR] User login failed: Invalid password for ${email}`);
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`[AUTH SUCCESS] User logged in: ${email} | Role: ${user.role}`);
    res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (err) {
    console.log(`[AUTH ERROR] User login server error for ${email || 'unknown'}: ${err.message}`);
    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= GET ME ================= */

export const getMe = async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    res.json(user);

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }

};


/* ================= UPDATE PROFILE ================= */

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, foodPreference, deliveryTime, notifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    user.address = address !== undefined ? address : user.address;
    user.foodPreference = foodPreference !== undefined ? foodPreference : user.foodPreference;
    user.deliveryTime = deliveryTime !== undefined ? deliveryTime : user.deliveryTime;
    user.notifications = notifications !== undefined ? notifications : user.notifications;

    await user.save();

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOGGLE FAVORITE ================= */

export const toggleFavorite = async (req, res) => {
  try {
    const { foodId } = req.body;
    if (!foodId) {
      return res.status(400).json({ message: "Food ID is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    const index = user.favorites.indexOf(foodId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(foodId);
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GOOGLE LOGIN ================= */

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        uid,
        provider: "google",
        avatar: picture || "",
      });
    } else {
      let updated = false;
      if (!user.uid) {
        user.uid = uid;
        user.provider = "google";
        updated = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (err) {
    console.error("Google login verification failed:", err);
    console.log(`[AUTH ERROR] Google login verification failed: ${err.message}`);
    res.status(401).json({ message: "Invalid Google token or verification failed" });
  }
};

/* ================= FORGOT PASSWORD ================= */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    if (user.provider === "google") {
      return res.status(400).json({ 
        message: "This account is registered using Google. Please login with Google." 
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
        <h2 style="color: #f97316; margin-top: 0;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password for your ByteBite account. Please click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If you cannot click the button, copy and paste the following link into your browser:</p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain secure.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "ByteBite Password Reset Request",
        text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
        html: message
      });

      res.json({ success: true, message: "Email sent successfully" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      console.error("Failed to send reset email:", err);
      return res.status(500).json({ message: "Email could not be sent" });
    }

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};