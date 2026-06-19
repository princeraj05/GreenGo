import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  discountText: { type: String, default: "" },
  buttonText: { type: String, default: "ORDER NOW" },
  image: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Banner", bannerSchema);
