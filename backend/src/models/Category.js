import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  foodType: { type: String, enum: ['Veg', 'Non-Veg', 'Egg'], default: 'Veg' },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
