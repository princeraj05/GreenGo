import mongoose from "mongoose";
import { seedInitialReviews } from "./seedReviews.js";
import { seedInitialFoods } from "./seedFoods.js";
import { seedCategories } from "../controllers/categoryController.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Atlas Connected");
    
    // Auto seed starter data if collections are empty
    await seedCategories();
    await seedInitialFoods();
    await seedInitialReviews();
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
