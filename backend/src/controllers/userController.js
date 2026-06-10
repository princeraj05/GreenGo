import User from "../models/User.js";
import Otp from "../models/Otp.js";
import Food from "../models/Food.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import admin from "../config/firebase.js";
import crypto from "crypto";
import { sendEmail } from "../services/emailService.js";
import { createAdminNotification } from "../services/adminNotificationService.js";

const maskToken = (token) => {
  if (!token) return "none";
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
};

const PASSWORD_RULE_MESSAGE = "Password must be at least 6 characters and include alphabet, number, and special character.";
const isStrongPassword = (password = "") => (
  String(password).length >= 6 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
);

const normalizeRole = (role) => (role === "user" || !role ? "customer" : role);

const sanitizeBody = (body = {}) => ({
  ...body,
  password: body.password ? "***" : body.password,
  idToken: body.idToken ? maskToken(body.idToken) : body.idToken,
});

const cleanAddressPart = (value = "") => String(value)
  .replace(/\b(?:Jaipur|Rajasthan)\b/gi, "")
  .replace(/\s*,\s*,/g, ",")
  .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
  .trim();

const normalizeAddresses = (addresses = [], fallbackAddress = "") => {
  const normalized = Array.isArray(addresses)
    ? addresses
        .map((addr) => ({
          label: String(addr.label || "Home").trim() || "Home",
          details: cleanAddressPart(addr.details || addr.address || ""),
          city: cleanAddressPart(addr.city || ""),
          state: cleanAddressPart(addr.state || ""),
          isPrimary: Boolean(addr.isPrimary),
        }))
        .filter((addr) => addr.details)
    : [];

  if (normalized.length === 0 && fallbackAddress) {
    normalized.push({
      label: "Home",
      details: cleanAddressPart(String(fallbackAddress).replace(/^Home:\s*|^Office:\s*/i, "")),
      city: "",
      state: "",
      isPrimary: true,
    });
  }

  if (normalized.length > 0 && !normalized.some((addr) => addr.isPrimary)) {
    normalized[0].isPrimary = true;
  }

  return normalized.map((addr, index) => ({
    ...addr,
    isPrimary: index === normalized.findIndex((item) => item.isPrimary),
  }));
};

const formatAddress = (addr) => {
  if (!addr) return "";
  return [addr.label, addr.details, addr.city, addr.state].filter(Boolean).join(" - ");
};

const budgetDummyFoods = [
  { _id: "dummy-paneer-roll", name: "Paneer Roll", price: 129, category: "Veg", veg: true, description: "Budget friendly paneer roll", rating: 4.4, ratingCount: 24, totalOrders: 80, image: "" },
  { _id: "dummy-chicken-burger", name: "Chicken Burger", price: 169, category: "Chicken", veg: false, description: "Juicy chicken burger combo base", rating: 4.5, ratingCount: 32, totalOrders: 100, image: "" },
  { _id: "dummy-veg-pizza", name: "Veg Pizza", price: 199, category: "Pizza", veg: true, description: "Loaded veggie pizza", rating: 4.3, ratingCount: 28, totalOrders: 75, image: "" },
  { _id: "dummy-roti-combo", name: "Roti Sabzi Combo", price: 149, category: "Roti", veg: true, description: "Homestyle roti with sabzi", rating: 4.2, ratingCount: 20, totalOrders: 70, image: "" },
  { _id: "dummy-lassi", name: "Sweet Lassi", price: 69, category: "Drinks", veg: true, description: "Cold Punjabi lassi", rating: 4.6, ratingCount: 18, totalOrders: 60, image: "" },
  { _id: "dummy-gulab-jamun", name: "Gulab Jamun", price: 79, category: "Desserts", veg: true, description: "Classic sweet dessert", rating: 4.7, ratingCount: 22, totalOrders: 55, image: "" },
];

const userDetailLine = (user) =>
  `Name: ${user.name || "N/A"} | Email: ${user.email || "N/A"} | Phone: ${user.phone || "N/A"}`;

const notifyAdminUserEvent = async (title, user, type = "info") => {
  if (!user || user.role === "admin") return;
  await createAdminNotification({
    title,
    message: userDetailLine(user),
    type,
    actionPath: "/admin/users",
    data: {
      event: title.toLowerCase().replace(/\s+/g, "_"),
      userId: String(user._id),
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "customer",
    },
  });
};

const normalizeDeliveryDetails = (user) => {
  if (user.role !== "deliveryBoy") return;
  const details = user.deliveryDetails || {};
  const address = String(details.address || user.address || "").trim();
  const hasProfile = Boolean(String(user.name || "").trim() && String(user.phone || "").trim() && address && user.password);
  user.deliveryDetails = {
    ...details,
    address,
    profileCompleted: hasProfile,
    completedAt: hasProfile ? details.completedAt || new Date() : null,
    updatedAt: details.updatedAt || new Date(),
    changeLog: details.changeLog || [],
  };
  user.profileCompletion = {
    ...(user.profileCompletion || {}),
    passwordSet: Boolean(user.password),
    completed: hasProfile,
    completionPercent: hasProfile ? 100 : 0,
    updatedAt: new Date(),
  };
};

const hasUsableAddress = (user) => {
  if (Array.isArray(user.addresses) && user.addresses.some((addr) => String(addr.details || "").trim())) {
    return true;
  }
  return Boolean(String(user.address || "").trim());
};

const normalizeCustomerProfileCompletion = (user) => {
  if (user.role === "deliveryBoy" || user.role === "admin") return;
  const editProfileCompleted = Boolean(String(user.name || "").trim() && String(user.phone || "").trim() && user.password);
  const addressCompleted = hasUsableAddress(user);
  const completionPercent = (editProfileCompleted ? 50 : 0) + (addressCompleted ? 50 : 0);
  user.profileCompletion = {
    ...(user.profileCompletion || {}),
    passwordSet: Boolean(user.password),
    editProfileCompleted,
    addressCompleted,
    completionPercent,
    completed: completionPercent === 100,
    updatedAt: new Date(),
  };
};

const normalizeUserCompletion = (user) => {
  if (!user) return;
  normalizeCustomerProfileCompletion(user);
  normalizeDeliveryDetails(user);
};

const logDeliveryChange = (user, field, oldValue, newValue) => {
  if (user.role !== "deliveryBoy") return;
  const before = oldValue == null ? "" : String(oldValue);
  const after = newValue == null ? "" : String(newValue);
  if (before === after) return;
  if (!user.deliveryDetails) user.deliveryDetails = {};
  if (!Array.isArray(user.deliveryDetails.changeLog)) user.deliveryDetails.changeLog = [];
  user.deliveryDetails.changeLog.push({
    field,
    oldValue: before,
    newValue: after,
    changedAt: new Date(),
  });
  user.deliveryDetails.changeLog = user.deliveryDetails.changeLog.slice(-20);
};

/* ================= REGISTER ================= */

export const registerUser = async (req, res) => {
  try {

    const { name, email, password, phone, address } = req.body;

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    normalizeUserCompletion(user);
    await user.save();

    await notifyAdminUserEvent("New User Registered", user, "success");

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
  let email = "unknown";

  try {

    const { password } = req.body;
    email = req.body?.email || "unknown";
    console.log("[AUTH DEBUG] Login request body received:", sanitizeBody(req.body));

    const user = await User.findOne({ email });
    console.log("[AUTH DEBUG] User lookup result:", user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      provider: user.provider,
      hasPassword: Boolean(user.password),
    } : "not found");

    if (!user) {
      console.log(`[AUTH ERROR] User login failed: User not found (${email})`);
      console.log("[AUTH DEBUG] Final response status: 400");
      return res.status(400).json({
        message: "User not found"
      });
    }

    if (!user.password) {
      console.log(`[AUTH ERROR] User login failed: No password hash exists for ${email}; provider=${user.provider}`);
      console.log("[AUTH DEBUG] Final response status: 400");
      return res.status(400).json({
        message: "This account is registered using Google. Please login with Google."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("[AUTH DEBUG] Password validation result:", isMatch);

    if (!isMatch) {
      console.log(`[AUTH ERROR] User login failed: Invalid password for ${email}`);
      console.log("[AUTH DEBUG] Final response status: 400");
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    user.lastLogin = new Date();
    normalizeUserCompletion(user);
    await user.save();
    await notifyAdminUserEvent("User Logged In", user, "info");

    const jwtPayload = {
      id: user._id,
      email: user.email,
      role: normalizeRole(user.role)
    };
    console.log("[AUTH DEBUG] JWT payload:", jwtPayload);

    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[AUTH DEBUG] JWT creation success:", maskToken(token));

    console.log(`[AUTH SUCCESS] User logged in: ${email} | Role: ${user.role}`);
    console.log("[AUTH DEBUG] Final response status: 200");
    res.json({
      success: true,
      token,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.log(`[AUTH ERROR] User login server error for ${email}: ${err.message}`);
    console.log("[AUTH DEBUG] JWT creation/password validation failure stack:", err.stack);
    console.log("[AUTH DEBUG] Final response status: 500");
    res.status(500).json({
      message: "Server error"
    });
  }
};

export const loginWithPhonePassword = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "We couldn't verify your phone number and password. Please sign in with email OTP or Google, complete your profile, and set a password." });
    }
    if (!user.password) {
      return res.status(400).json({ message: "A password has not been set for this account. Please sign in with email OTP or Google, complete your profile, and set a password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "We couldn't verify your phone number and password. Please sign in with email OTP or Google, complete your profile, and set a password." });
    }

    user.lastLogin = new Date();
    normalizeUserCompletion(user);
    await user.save();
    await notifyAdminUserEvent("User Logged In", user, "info");

    const role = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, role });
  } catch (err) {
    console.error("Phone password login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= GET ME ================= */

export const getMe = async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");
    if (user && (!user.addresses || user.addresses.length === 0) && user.address) {
      user.addresses = normalizeAddresses([], user.address);
      const primary = user.addresses.find((addr) => addr.isPrimary);
      user.primaryAddressId = primary?._id || null;
      await user.save();
    }
    normalizeUserCompletion(user);
    await user.save();

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
    const {
      name,
      phone,
      address,
      addresses,
      primaryAddressId,
      foodPreference,
      deliveryTime,
      notifications,
      birthDate,
      password,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousName = user.name || "";
    const previousPhone = user.phone || "";
    const previousDeliveryAddress = user.deliveryDetails?.address || user.address || "";
    const previousLatitude = user.deliveryDetails?.latitude;
    const previousLongitude = user.deliveryDetails?.longitude;

    user.name = name || user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    if (addresses !== undefined) {
      const nextAddresses = normalizeAddresses(addresses, address || user.address);
      if (nextAddresses.length > 0) {
        user.addresses = nextAddresses;
        if (primaryAddressId) {
          user.addresses.forEach((addr) => {
            addr.isPrimary = String(addr._id) === String(primaryAddressId);
          });
          if (!user.addresses.some((addr) => addr.isPrimary)) {
            user.addresses[0].isPrimary = true;
          }
        }
        const primary = user.addresses.find((addr) => addr.isPrimary) || user.addresses[0];
        user.primaryAddressId = primary._id;
        user.address = formatAddress(primary);
      } else {
        user.addresses = [];
        user.primaryAddressId = null;
        user.address = "";
      }
    } else if (address !== undefined) {
      user.address = address;
      user.addresses = normalizeAddresses(user.addresses, address);
      const primary = user.addresses.find((addr) => addr.isPrimary) || user.addresses[0];
      user.primaryAddressId = primary?._id || null;
    }
    user.foodPreference = foodPreference !== undefined ? foodPreference : user.foodPreference;
    user.deliveryTime = deliveryTime !== undefined ? deliveryTime : user.deliveryTime;
    user.notifications = notifications !== undefined ? notifications : user.notifications;
    user.birthDate = birthDate !== undefined && birthDate !== "" ? new Date(birthDate) : user.birthDate;
    if (password !== undefined && password !== "") {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (user.role === "deliveryBoy") {
      const nextDeliveryAddress = deliveryAddress !== undefined ? deliveryAddress : address;
      if (!user.deliveryDetails) user.deliveryDetails = {};
      if (nextDeliveryAddress !== undefined) {
        user.deliveryDetails.address = String(nextDeliveryAddress || "").trim();
        user.address = user.deliveryDetails.address;
      }
      if (deliveryLatitude !== undefined && deliveryLatitude !== "") {
        user.deliveryDetails.latitude = Number(deliveryLatitude);
      }
      if (deliveryLongitude !== undefined && deliveryLongitude !== "") {
        user.deliveryDetails.longitude = Number(deliveryLongitude);
      }
      logDeliveryChange(user, "name", previousName, user.name);
      logDeliveryChange(user, "phone", previousPhone, user.phone);
      logDeliveryChange(user, "address", previousDeliveryAddress, user.deliveryDetails.address || "");
      logDeliveryChange(user, "latitude", previousLatitude, user.deliveryDetails.latitude);
      logDeliveryChange(user, "longitude", previousLongitude, user.deliveryDetails.longitude);
      user.deliveryDetails.updatedAt = new Date();
      normalizeDeliveryDetails(user);
    }

    normalizeUserCompletion(user);
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

/* ================= BUDGET ASSISTANT ================= */

export const getBudgetRecommendations = async (req, res) => {
  try {
    const {
      people = 1,
      budgetMin = 0,
      budgetMax = 500,
      preference = "Both",
      selectedTypes = []
    } = req.body;

    const maxBudget = Math.max(Number(budgetMax) || 500, Number(budgetMin) || 0);
    const customerPeople = Math.max(1, Math.ceil(Number(people) || 1));
    const types = Array.isArray(selectedTypes) ? selectedTypes.map((type) => String(type).toLowerCase()) : [];

    let foods = await Food.find().lean();
    if (foods.length === 0) {
      foods = budgetDummyFoods;
    }

    foods = foods.filter((food) => {
      const name = String(food.name || "").toLowerCase();
      const category = String(food.category || "").toLowerCase();
      const description = String(food.description || "").toLowerCase();
      const isVeg = food.veg === true || category.includes("veg") || name.includes("veg") || name.includes("paneer");
      const isNonVeg = food.veg === false || category.includes("non-veg") || category.includes("chicken") || name.includes("chicken") || name.includes("egg");

      if (preference === "Veg" && !isVeg) return false;
      if (preference === "Non-Veg" && !isNonVeg) return false;

      if (types.length === 0) return true;
      return types.some((type) => {
        if (type === "drinks") return category.includes("drink") || category.includes("water") || name.includes("drink") || name.includes("cola");
        if (type === "desserts") return category.includes("dessert") || category.includes("sweet") || name.includes("cake") || name.includes("sweet");
        return category.includes(type) || name.includes(type) || description.includes(type);
      });
    });

    const rankedFoods = foods.sort((a, b) => {
      const aScore = (a.rating || 0) * 10 + (a.ratingCount || 0) + (a.totalOrders || 0);
      const bScore = (b.rating || 0) * 10 + (b.ratingCount || 0) + (b.totalOrders || 0);
      return bScore - aScore || a.price - b.price;
    });

    const withBudgetMath = rankedFoods.map((food) => {
      const servingSize = Math.max(1, Math.ceil(Number(food.servingSize || 1)));
      const requiredQuantity = Math.ceil(customerPeople / servingSize);
      const unitPrice = Number(food.price || 0) + Number(food.packingCharge || 0);
      const finalPrice = requiredQuantity * unitPrice;
      return {
        ...food,
        servingSize,
        requiredQuantity,
        finalPrice,
        budgetShortfall: Math.max(0, finalPrice - maxBudget),
      };
    });

    const individualDishes = withBudgetMath
      .filter((food) => food.finalPrice <= maxBudget)
      .slice(0, 6);

    const mains = withBudgetMath.filter((food) => {
      const category = String(food.category || "").toLowerCase();
      return !category.includes("drink") && !category.includes("water") && !category.includes("sweet") && !category.includes("dessert");
    });
    const sides = withBudgetMath.filter((food) => {
      const category = String(food.category || "").toLowerCase();
      const name = String(food.name || "").toLowerCase();
      return category.includes("drink") || category.includes("water") || category.includes("sweet") || category.includes("dessert") || name.includes("drink");
    });

    const combos = [];
    const sidePool = sides.length > 0 ? sides : rankedFoods;
    for (const main of mains.slice(0, 8)) {
      for (const side of sidePool.slice(0, 8)) {
        if (String(main._id) === String(side._id)) continue;
        const total = Number(main.finalPrice || 0) + Number(side.finalPrice || 0);
        if (total <= maxBudget) {
          combos.push({
            name: `${main.name} + ${side.name}`,
            items: [main, side],
            price: total,
          });
        }
      }
    }

    res.json({
      success: true,
      individualDishes,
      combos: combos.sort((a, b) => b.price - a.price).slice(0, 4),
      estimatedCost: individualDishes[0] ? Number(individualDishes[0].finalPrice || 0) : 0,
      budgetExceeded: withBudgetMath
        .filter((food) => food.finalPrice > maxBudget)
        .sort((a, b) => a.budgetShortfall - b.budgetShortfall)
        .slice(0, 1),
    });
  } catch (err) {
    console.error("Budget assistant error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GOOGLE LOGIN ================= */

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("[AUTH DEBUG] Google login request body received:", sanitizeBody(req.body));
    if (!idToken) {
      console.log("[AUTH DEBUG] Google final response status: 400");
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    console.log("[AUTH DEBUG] Firebase token verified:", { uid, email, name, hasPicture: Boolean(picture) });

    let user = await User.findOne({ email });
    console.log("[AUTH DEBUG] Google user lookup result:", user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      provider: user.provider,
      uid: user.uid,
    } : "not found");

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        uid,
        provider: "google",
        avatar: picture || "",
        role: "customer",
        lastLogin: new Date()
      });
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent("New Google User", user, "success");
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
      user.lastLogin = new Date();
      updated = true;
      if (updated) {
        normalizeUserCompletion(user);
        await user.save();
      }
      await notifyAdminUserEvent("User Logged In", user, "info");
    }

    const jwtPayload = {
      id: user._id,
      email: user.email,
      role: normalizeRole(user.role)
    };
    console.log("[AUTH DEBUG] Google JWT payload:", jwtPayload);

    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[AUTH DEBUG] Google JWT creation success:", maskToken(token));
    console.log("[AUTH DEBUG] Google final response status: 200");

    res.json({
      success: true,
      token,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Google login verification failed:", err);
    console.log(`[AUTH ERROR] Google login verification failed: ${err.message}`);
    console.log("[AUTH DEBUG] Google final response status: 401");
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
        <p>You requested to reset your password for your GreenGo account. Please click the button below to set a new password. This link will expire in 1 hour.</p>
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
        subject: "GreenGo Password Reset Request",
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
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
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

/* ================= SEND EMAIL OTP ================= */

export const sendOtpEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete existing OTPs for this email and save new one
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    console.log(`[OTP DEBUG] Generated Email OTP ${otp} for ${email}`);

    // Send email
    const subject = "GreenGo Verification Code";
    const text = `Your GreenGo verification code is: ${otp}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
        <h2 style="color: #f97316; margin-top: 0; text-align: center;">GreenGo</h2>
        <p>Dear Customer,</p>
        <p>Your one-time password (OTP) to log in or create your GreenGo account is:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f97316; background-color: #fef3c7; padding: 12px 24px; border-radius: 8px;">${otp}</span>
        </div>
        <p>This code is valid for 5 minutes. Please do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">GreenGo - Delivering Happiness</p>
      </div>
    `;

    try {
      await sendEmail({ to: email, subject, text, html });
      res.json({ success: true, message: "OTP sent to your email successfully" });
    } catch (emailErr) {
      console.error("[OTP ERROR] Failed to send email via SMTP, sending mock success response:", emailErr.message);
      // In case SMTP is blocked/fails, we still return the OTP in development to prevent breaking the flow
      res.json({
        success: true,
        message: "OTP generated (SMTP send failed, fallback enabled)",
        otp: process.env.NODE_ENV === "production" ? undefined : otp // Expose OTP only in development/testing environments
      });
    }

  } catch (err) {
    console.error("Send email OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY EMAIL OTP ================= */

export const verifyOtpEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Delete verified OTP
    await Otp.deleteMany({ email });

    let user = await User.findOne({ email });
    if (!user) {
      // Auto-create user
      user = await User.create({
        name: email.split("@")[0],
        email,
        role: "customer",
        provider: "email",
        lastLogin: new Date()
      });
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent("New Email OTP User", user, "success");
    } else {
      user.lastLogin = new Date();
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent("User Logged In", user, "info");
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: normalizeRole(user.role)
      },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Verify email OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SEND PHONE OTP ================= */

export const sendOtpPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete existing OTPs for this phone and save new one
    await Otp.deleteMany({ phone });
    await Otp.create({ phone, otp, expiresAt });

    console.log(`[OTP DEBUG] Generated Phone OTP ${otp} for ${phone}`);

    // Return the OTP in response since real SMS service is not integrated
    res.json({
      success: true,
      message: "OTP sent to your phone number successfully",
      otp // Expose OTP for developers/testing
    });

  } catch (err) {
    console.error("Send phone OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY PHONE OTP ================= */

export const verifyOtpPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const otpRecord = await Otp.findOne({ phone, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Delete verified OTP
    await Otp.deleteMany({ phone });

    let user = await User.findOne({ phone });
    if (!user) {
      // Auto-create user
      user = await User.create({
        name: `User_${phone.slice(-4)}`,
        phone,
        role: "customer",
        provider: "phone",
        lastLogin: new Date()
      });
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent("New Phone OTP User", user, "success");
    } else {
      user.lastLogin = new Date();
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent("User Logged In", user, "info");
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: normalizeRole(user.role)
      },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Verify phone OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

