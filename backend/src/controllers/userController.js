import User from "../models/User.js";
import Otp from "../models/Otp.js";
import Food from "../models/Food.js";
import Session from "../models/Session.js";
import SecurityLog from "../models/SecurityLog.js";
import { encryptText, decryptText, hashText } from "../config/cryptoHelper.js";
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
    const { name, email, password, phone, address, privacyPolicyAccepted, termsAccepted } = req.body;

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    let pHash = undefined;
    let pEncrypted = "";
    if (phone) {
      pHash = hashText(phone);
      pEncrypted = encryptText(phone);
      
      const existingPhone = await User.findOne({ phoneHash: pHash, isDeleted: false });
      if (existingPhone) {
        return res.status(400).json({
          message: "mobile number already used plz enter another phone number"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneEncrypted: pEncrypted,
      phoneHash: pHash,
      phone: phone || "",
      address,
      privacyPolicyAcceptedAt: privacyPolicyAccepted ? new Date() : null,
      termsAcceptedAt: termsAccepted ? new Date() : null,
      privacyPolicyVersion: privacyPolicyAccepted ? "1.0.0" : "",
      termsVersion: termsAccepted ? "1.0.0" : ""
    });

    normalizeUserCompletion(user);
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: "user_registered",
      details: `User registered successfully with email: ${email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    await notifyAdminUserEvent("New User Registered", user, "success");

    res.json({
      success: true,
      message: "Registration successful"
    });

  } catch (err) {
    console.error("Register error:", err);
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

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check account lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitTime = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (60 * 1000));
      return res.status(403).json({ message: `Account temporarily locked due to excessive failed attempts. Try again in ${waitTime} minutes.` });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account is registered using Google. Please login with Google." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.failedLoginAttempts = 0;
        await user.save();
        await SecurityLog.create({
          userId: user._id,
          action: "account_locked",
          details: `User locked out temporarily due to 5 consecutive failed login attempts.`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'] || ""
        });
      } else {
        await user.save();
      }

      await SecurityLog.create({
        userId: user._id,
        action: "failed_login_attempt",
        details: `Invalid password entry for user: ${email}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || ""
      });

      return res.status(400).json({ message: "Invalid password" });
    }

    // Reset failed login stats on success
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    normalizeUserCompletion(user);
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful login for email: ${email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    // JWT Security: generate 15 min access token, 30 day refresh rotation session
    const token = jwt.sign(
      { id: user._id, email: user.email, role: normalizeRole(user.role) },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    // Save active session record
    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : userAgent.includes("Android") ? "Android" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      token,
      refreshToken,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Login user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginWithPhonePassword = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const pHash = hashText(phone);
    const user = await User.findOne({ phoneHash: pHash, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    // Check account lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitTime = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (60 * 1000));
      return res.status(403).json({ message: `Account temporarily locked due to excessive failed attempts. Try again in ${waitTime} minutes.` });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();

      await SecurityLog.create({
        userId: user._id,
        action: "failed_login_attempt",
        details: `Invalid password entry for phone: ${phone}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || ""
      });

      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    normalizeUserCompletion(user);
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful phone login for: ${phone}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    const role = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.json({ success: true, token, refreshToken, role });
  } catch (err) {
    console.error("Phone password login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* ================= GET ME ================= */

export const getMe = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);
    if (user && (!user.addresses || user.addresses.length === 0) && user.address) {
      user.addresses = normalizeAddresses([], user.address);
      const primary = user.addresses.find((addr) => addr.isPrimary);
      user.primaryAddressId = primary?._id || null;
      await user.save();
    }
    normalizeUserCompletion(user);
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);

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
    
    if (phone !== undefined && phone !== user.phone) {
      const pHash = hashText(phone);
      const existingPhone = await User.findOne({ phoneHash: pHash, isDeleted: false, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({
          message: "mobile number already used plz enter another phone number"
        });
      }
      user.phone = phone;
      user.phoneHash = pHash;
      user.phoneEncrypted = encryptText(phone);
    }

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
      
      await SecurityLog.create({
        userId: user._id,
        action: "password_change",
        details: `Password changed successfully.`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || ""
      });
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

    await SecurityLog.create({
      userId: user._id,
      action: "profile_update",
      details: `Profile fields updated successfully.`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ success: true, message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    console.error("Update profile error:", err);
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
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    // Save active session record
    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful Google authentication and session creation for email: ${email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent
    });

    console.log("[AUTH DEBUG] Google JWT creation success:", maskToken(token));
    console.log("[AUTH DEBUG] Google final response status: 200");

    res.json({
      success: true,
      token,
      refreshToken,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Google login verification failed:", err);
    console.log(`[AUTH ERROR] Google login verification failed: ${err.message}`);
    console.log("[AUTH DEBUG] Google final response status: 401");
    res.status(401).json({ message: "Invalid Google token or verification failed" });
  }
};

/* ================= FIREBASE GENERAL LOGIN ================= */

export const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("[AUTH DEBUG] Firebase login request received");
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, phone_number, name, picture, firebase } = decodedToken;
    const provider = firebase?.sign_in_provider || "firebase";
    
    console.log("[AUTH DEBUG] Firebase token verified successfully:", { uid, email, phone_number, provider });

    // Try to find the user by email or phone
    let query = {};
    if (email) {
      query.email = email;
    } else if (phone_number) {
      const cleanPhone = phone_number.replace(/^\+91/, "");
      query.$or = [{ phone: phone_number }, { phone: cleanPhone }];
    } else {
      return res.status(400).json({ message: "Invalid token details. Email or phone number is required." });
    }

    let user = await User.findOne(query);

    if (!user) {
      // Create new user
      const defaultName = name || (email ? email.split("@")[0] : `User_${(phone_number || '').slice(-4)}`);
      user = await User.create({
        name: defaultName,
        email: email || undefined,
        phone: phone_number ? phone_number.replace(/^\+91/, "") : undefined,
        uid,
        provider,
        avatar: picture || "",
        role: "customer",
        lastLogin: new Date()
      });
      normalizeUserCompletion(user);
      await user.save();
      await notifyAdminUserEvent(`New ${provider} User`, user, "success");
    } else {
      // Sync info with user account
      let updated = false;
      if (!user.uid) {
        user.uid = uid;
        user.provider = provider;
        updated = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        updated = true;
      }
      if (phone_number && !user.phone) {
        user.phone = phone_number.replace(/^\+91/, "");
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

    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    // Save active session record
    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful Firebase/Social login and session creation for provider: ${provider}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent
    });

    res.json({
      success: true,
      token,
      refreshToken,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Firebase authentication failed:", err);
    res.status(401).json({ message: "Firebase verification failed or invalid token" });
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
      console.error("Failed to send reset email, returning fallback resetUrl:", err);
      res.json({
        success: true,
        message: "Email could not be sent, but reset link is available for demo",
        resetUrl
      });
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
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
      console.error("[OTP ERROR] Failed to send email via SMTP:", emailErr.message);
      res.json({
        success: true,
        message: "OTP generated (SMTP failed, check console/network request)",
        otp
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
    if (!otpRecord) {
      console.log(`[OTP VERIFY DEBUG] No OTP record found for email: ${email} and otp: ${otp}`);
      const anyRecord = await Otp.findOne({ email });
      if (anyRecord) {
        console.log(`[OTP VERIFY DEBUG] Active OTP for this email in database is actually: ${anyRecord.otp} (expiresAt: ${anyRecord.expiresAt})`);
      } else {
        console.log(`[OTP VERIFY DEBUG] No OTP records exist at all in database for email: ${email}`);
      }
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      console.log(`[OTP VERIFY DEBUG] OTP record found but is expired. expiresAt: ${otpRecord.expiresAt}, server time: ${new Date()}`);
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
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    // Save active session record
    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful email OTP verification and session creation for email: ${email}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent
    });

    res.json({
      success: true,
      token,
      refreshToken,
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
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "30d" }
    );

    // Save active session record
    const userAgent = req.headers['user-agent'] || "";
    await Session.create({
      userId: user._id,
      token,
      deviceName: userAgent.includes("Mobi") ? "Mobile Device" : "Desktop Device",
      browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
      os: userAgent.includes("Windows") ? "Windows" : "OS",
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await SecurityLog.create({
      userId: user._id,
      action: "login_success",
      details: `Successful phone OTP verification and session creation for phone: ${phone}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent
    });

    res.json({
      success: true,
      token,
      refreshToken,
      role: normalizeRole(user.role)
    });

  } catch (err) {
    console.error("Verify phone OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PRIVACY CENTER - DOWNLOAD MY DATA ================= */
export const downloadUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -twoFactorSecret");
    if (!user) return res.status(404).json({ message: "User not found" });

    const [orders, sessions] = await Promise.all([
      Order.find({ userId: req.user.id }).lean(),
      Session.find({ userId: req.user.id }).select("-token").lean()
    ]);

    const exportedData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        role: user.role,
        birthDate: user.birthDate,
        createdAt: user.createdAt,
        privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt,
        termsAcceptedAt: user.termsAcceptedAt
      },
      addresses: user.addresses || [],
      orders: orders.map(o => ({
        orderId: o._id,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod
      })),
      sessions: sessions.map(s => ({
        deviceName: s.deviceName,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        loginTime: s.loginTime,
        lastActivity: s.lastActivity
      }))
    };

    res.setHeader("Content-Disposition", `attachment; filename=greengo_user_data_${req.user.id}.json`);
    res.setHeader("Content-Type", "application/json");
    res.json(exportedData);

  } catch (err) {
    console.error("Download user data error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PRIVACY CENTER - REQUEST ACCOUNT DELETION ================= */
export const requestAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.phoneHash = undefined; // Avoid duplicate phone lockout for future registers
    await user.save();

    // Kill all sessions
    await Session.deleteMany({ userId: req.user.id });

    // Audit logs
    await SecurityLog.create({
      userId: user._id,
      action: "user_requested_deletion",
      details: `User requested account deletion. Soft delete period initiated (7 days recovery window).`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    res.json({ success: true, message: "Account scheduled for deletion. You have 7 days to log back in to recover it." });
  } catch (err) {
    console.error("Request account deletion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DEVICE / SESSIONS MANAGEMENT ================= */
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).select("-token").sort({ lastActivity: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    await Session.deleteOne({ _id: req.params.sessionId });

    await SecurityLog.create({
      userId: req.user.id,
      action: "session_revoked",
      details: `User revoked session ID: ${req.params.sessionId}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    res.json({ success: true, message: "Device session logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    await Session.deleteMany({ userId: req.user.id });

    await SecurityLog.create({
      userId: req.user.id,
      action: "all_sessions_revoked",
      details: `User logged out from all active device sessions.`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    res.json({ success: true, message: "Successfully logged out from all devices" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SECURITY AUDIT LOGS (ADMIN ONLY) ================= */
export const getSecurityLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


