import Food from "../models/Food.js";

export const getFoods = async (req, res) => {
  const foods = await Food.find().sort({ createdAt: -1 });
  res.json(foods);
};

export const addFood = async (req, res) => {
  try {
    const { name, price, description } = req.body;

    const food = await Food.create({
      name,
      price,
      description,
      image: req.file.path, // Save the full Cloudinary URL
    });

    res.json(food);
  } catch {
    res.status(500).json({ message: "Add food failed" });
  }
};

export const deleteFood = async (req, res) => {
  await Food.findByIdAndDelete(req.params.id);
  res.json({ message: "Food deleted" });
};
