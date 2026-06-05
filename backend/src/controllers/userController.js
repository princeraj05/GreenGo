import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
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

    res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (err) {
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