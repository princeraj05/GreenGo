import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {

  const { uid, email, name } = req.user;

  let user = await User.findOne({ email });

  if (!user) {

    user = await User.create({
      uid,
      name,
      email,
      role: "customer"
    });

  }

  // ✅ TOKEN GENERATE
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    "SECRET123",
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
    role: user.role
  });

};
