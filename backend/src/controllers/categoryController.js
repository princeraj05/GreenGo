import Category from "../models/Category.js";

// Helper to get uploaded path
const getUploadedPath = (req) => req.file?.path || "";

// GET ALL CATEGORIES
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// ADD CATEGORY
export const addCategory = async (req, res) => {
  try {
    const { name, foodType } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const image = getUploadedPath(req);

    const category = await Category.create({
      name: name.trim(),
      image,
      foodType: foodType || "Veg"
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to add category" });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { name, foodType } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (foodType) updateData.foodType = foodType;

    const image = getUploadedPath(req);
    if (image) updateData.image = image;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};
