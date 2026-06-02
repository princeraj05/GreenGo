import Review from "../models/Review.js";
import Food from "../models/Food.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { updateFoodRatingStats } from "../controllers/reviewController.js";

export const seedInitialReviews = async () => {
  try {
    const reviewCount = await Review.countDocuments();
    if (reviewCount > 0) {
      console.log("ℹ️ Reviews database already has data. Skipping seed.");
      return;
    }

    console.log("🌱 Seeding initial reviews...");

    // Find a user or create a default one
    let user = await User.findOne({ role: "user" });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      user = await User.create({
        name: "Priya Sharma",
        email: "priya@example.com",
        password: "hashedpassword123",
        role: "user",
      });
    }

    // Find some foods
    const foods = await Food.find();
    if (foods.length === 0) {
      console.log("⚠️ No food items found in DB. Cannot seed reviews.");
      return;
    }

    // Create a mock order ID
    const mockOrderId = new mongoose.Types.ObjectId();

    const initialTestimonials = [
      {
        userName: "Priya S.",
        reviewText: "ByteBite changed my life! The food is always piping hot and the delivery is incredibly fast.",
        rating: 5,
      },
      {
        userName: "Rahul M.",
        reviewText: "The cleanest UI and the best restaurant selection. I order from here almost every single day.",
        rating: 5,
      },
      {
        userName: "Anjali K.",
        reviewText: "Highly recommend! The UI is gorgeous and the customer support is top-notch if you ever need it.",
        rating: 5,
      },
    ];

    for (let i = 0; i < initialTestimonials.length; i++) {
      const testimonial = initialTestimonials[i];
      // Distribute reviews across available foods
      const food = foods[i % foods.length];
      
      await Review.create({
        userId: user._id,
        userName: testimonial.userName,
        foodId: food._id,
        foodName: food.name,
        orderId: mockOrderId,
        rating: testimonial.rating,
        reviewText: testimonial.reviewText,
        hidden: false,
      });

      // Recalculate stats for this food item
      await updateFoodRatingStats(food._id);
    }

    console.log("✅ Initial reviews seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed initial reviews:", error);
  }
};
