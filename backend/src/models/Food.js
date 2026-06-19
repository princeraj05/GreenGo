import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  description: String,
  category: { type: String, default: "" },
  categories: [{ type: String }],
  categoryImage: String,
  veg: { type: Boolean, default: true },
  image: String,
  foodType: {
    type: String,
    enum: ["single", "combo"],
    default: "single"
  },
  mealCategory: { type: String, default: "Anytime" },
  servingSize: { type: Number, default: 1, min: 1 },
  variants: [{
    name: { type: String, default: "" },
    price: { type: Number, default: 0 }
  }],
  packingCharge: { type: Number, default: 0, min: 0 },
  comboItems: [{
    name: { type: String, default: "" },
    price: { type: Number, default: 0 }
  }],
  preparationTime: { type: String, default: "15 - 20 min" },
  spiceLevel: {
    type: String,
    enum: ["Small", "Medium", "Hard"],
    default: "Medium"
  },
  sizeLevel: {
    type: String,
    enum: ["Small", "Medium", "Hard"],
    default: "Medium"
  },
  featured: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  availableQty: { type: Number, default: 10 },
  totalOrders: { type: Number, default: 0 },
  revenueGenerated: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
}, { timestamps: true });

foodSchema.index({ category: 1, veg: 1, createdAt: -1 });
foodSchema.index({ categories: 1, veg: 1, createdAt: -1 });
foodSchema.index({ featured: 1, updatedAt: -1 });
foodSchema.index({ totalOrders: -1, popularityScore: -1 });
foodSchema.index({ revenueGenerated: -1 });
foodSchema.index({ rating: -1, ratingCount: -1 });

export default mongoose.model("Food", foodSchema);
