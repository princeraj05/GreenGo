import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  category: { type: String, default: "" },
  categoryImage: String,
  veg: { type: Boolean, default: true },
  image: String,
  featured: { type: Boolean, default: false },
  totalOrders: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
}, { timestamps: true });

foodSchema.index({ category: 1, veg: 1, createdAt: -1 });
foodSchema.index({ featured: 1, updatedAt: -1 });
foodSchema.index({ totalOrders: -1, popularityScore: -1 });
foodSchema.index({ revenueGenerated: -1 });
foodSchema.index({ rating: -1, ratingCount: -1 });

export default mongoose.model("Food", foodSchema);
