import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import User from "../models/User.js";

// Helper to update average rating and review count on the Food document
export const updateFoodRatingStats = async (foodId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { foodId: new mongoose.Types.ObjectId(foodId), hidden: false } },
      {
        $group: {
          _id: "$foodId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
      await Food.findByIdAndUpdate(foodId, {
        rating: roundedAvg,
        ratingCount: stats[0].count,
      });
    } else {
      await Food.findByIdAndUpdate(foodId, {
        rating: 0,
        ratingCount: 0,
      });
    }
  } catch (error) {
    console.error("Failed to update food rating stats:", error);
  }
};

/* ================= CREATE REVIEW ================= */
export const createReview = async (req, res) => {
  try {
    const { foodId, orderId, rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!foodId || !orderId || !rating) {
      return res.status(400).json({ message: "Food ID, Order ID, and Rating are required" });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars" });
    }

    // 1. Verify user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Verify order details and status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ message: "You can only review your own orders" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "You can only review items after delivery" });
    }

    // 3. Verify food is part of this order
    const orderedItem = order.items.find(item => String(item.foodId) === String(foodId));
    if (!orderedItem) {
      return res.status(400).json({ message: "This food item was not purchased in this order" });
    }

    // 4. Check for duplicate review
    const existingReview = await Review.findOne({ orderId, foodId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this item for this order" });
    }

    // 5. Create Review
    const review = await Review.create({
      userId,
      userName: user.name,
      foodId,
      foodName: orderedItem.name,
      orderId,
      rating: numRating,
      reviewText: reviewText ? String(reviewText).trim() : "",
    });

    // 6. Recalculate stats for the food item
    await updateFoodRatingStats(foodId);

    res.status(201).json({
      success: true,
      review,
    });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Failed to create review" });
  }
};

/* ================= GET ALL REVIEWS (PUBLIC / ADMIN) ================= */
export const getReviews = async (req, res) => {
  try {
    const { type, limit, rating, search } = req.query;

    const isAdminQuery = req.user && req.user.role === "admin";
    const filter = {};

    if (req.query.user === "me" && req.user) {
      filter.userId = req.user.id;
    } else {
      // Standard public filter omits moderated/hidden reviews
      if (!isAdminQuery) {
        filter.hidden = false;
      } else {
        // Admins can filter by specific hidden states or general ratings
        if (req.query.hidden !== undefined) {
          filter.hidden = req.query.hidden === "true";
        }
      }
    }

    if (rating) {
      filter.rating = Number(rating);
    }

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { foodName: { $regex: search, $options: "i" } },
        { reviewText: { $regex: search, $options: "i" } },
      ];
    }

    let query = Review.find(filter);

    // Apply sorting types
    if (type === "latest") {
      query = query.sort({ createdAt: -1 });
    } else if (type === "highest") {
      query = query.sort({ rating: -1, createdAt: -1 });
    } else if (type === "random") {
      // For random, we aggregate if sample is needed
      const sampleLimit = Number(limit || 6);
      const randReviews = await Review.aggregate([
        { $match: filter },
        { $sample: { size: sampleLimit } },
      ]);
      return res.json(randReviews);
    } else {
      query = query.sort({ createdAt: -1 });
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const reviews = await query;
    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Failed to retrieve reviews" });
  }
};

/* ================= GET REVIEWS FOR SPECIFIC FOOD ================= */
export const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const reviews = await Review.find({ foodId, hidden: false }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Get food reviews error:", err);
    res.status(500).json({ message: "Failed to retrieve reviews for this food" });
  }
};

/* ================= UPDATE REVIEW ================= */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Owner authorization check
    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized to edit this review" });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5 stars" });
      }
      review.rating = numRating;
    }

    if (reviewText !== undefined) {
      review.reviewText = String(reviewText).trim();
    }

    await review.save();

    // Recalculate stats for the food item
    await updateFoodRatingStats(review.foodId);

    res.json({
      success: true,
      review,
    });
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ message: "Failed to update review" });
  }
};

/* ================= DELETE REVIEW ================= */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Owner or Admin check
    if (String(review.userId) !== String(userId) && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this review" });
    }

    await Review.findByIdAndDelete(id);

    // Recalculate stats for the food item
    await updateFoodRatingStats(review.foodId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

/* ================= TOGGLE VISIBILITY (MODERATION) ================= */
export const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { hidden } = req.body;

    if (hidden === undefined) {
      return res.status(400).json({ message: "hidden value is required" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.hidden = Boolean(hidden);
    await review.save();

    // Recalculate stats for the food item since hidden state changed
    await updateFoodRatingStats(review.foodId);

    res.json({
      success: true,
      review,
    });
  } catch (err) {
    console.error("Toggle visibility error:", err);
    res.status(500).json({ message: "Failed to update review visibility" });
  }
};
