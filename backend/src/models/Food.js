import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  category: { type: String, default: "" },
  image: String,
  featured: { type: Boolean, default: false },
  totalOrders: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Food", foodSchema);
