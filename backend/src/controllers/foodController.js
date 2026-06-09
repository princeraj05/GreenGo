import Food from "../models/Food.js";

const getUploadedPath = (files, field) => files?.[field]?.[0]?.path || "";
const toBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};
const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const parseJsonArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const getFoods = async (req, res) => {
  const foods = await Food.find().sort({ createdAt: -1 }).lean();
  res.json(foods);
};

export const addFood = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      categoryImageCurrent,
      veg,
      foodType,
      mealCategory,
      servingSize,
      packingCharge,
      variants,
      comboItems
    } = req.body;
    const foodImage = getUploadedPath(req.files, "image");
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    const nextCategoryImage = categoryImageUpload || categoryImageCurrent || "";

    const food = await Food.create({
      name,
      price: toNumber(price),
      description,
      category,
      categoryImage: nextCategoryImage,
      veg: toBoolean(veg, true),
      foodType: foodType === "combo" ? "combo" : "single",
      mealCategory: mealCategory || "Anytime",
      servingSize: Math.max(1, Math.ceil(toNumber(servingSize, 1))),
      packingCharge: Math.max(0, toNumber(packingCharge, 0)),
      variants: parseJsonArray(variants),
      comboItems: parseJsonArray(comboItems),
      image: foodImage, // Save the full Cloudinary URL
    });

    if (categoryImageUpload && category) {
      await Food.updateMany({ category }, { $set: { categoryImage: categoryImageUpload } });
    }

    res.json(food);
  } catch {
    res.status(500).json({ message: "Add food failed" });
  }
};

export const updateFood = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      categoryImageCurrent,
      veg,
      featured,
      foodType,
      mealCategory,
      servingSize,
      packingCharge,
      variants,
      comboItems
    } = req.body;
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = toNumber(price);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (categoryImageUpload || categoryImageCurrent !== undefined) {
      updateData.categoryImage = categoryImageUpload || categoryImageCurrent || "";
    }
    if (veg !== undefined) updateData.veg = toBoolean(veg, true);
    if (featured !== undefined) updateData.featured = toBoolean(featured, false);
    if (foodType !== undefined) updateData.foodType = foodType === "combo" ? "combo" : "single";
    if (mealCategory !== undefined) updateData.mealCategory = mealCategory || "Anytime";
    if (servingSize !== undefined) updateData.servingSize = Math.max(1, Math.ceil(toNumber(servingSize, 1)));
    if (packingCharge !== undefined) updateData.packingCharge = Math.max(0, toNumber(packingCharge, 0));
    if (variants !== undefined) updateData.variants = parseJsonArray(variants);
    if (comboItems !== undefined) updateData.comboItems = parseJsonArray(comboItems);
    
    const foodImage = getUploadedPath(req.files, "image");
    if (foodImage) {
      updateData.image = foodImage; // Update with new Cloudinary URL
    }

    const food = await Food.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (categoryImageUpload && category) {
      await Food.updateMany({ category }, { $set: { categoryImage: categoryImageUpload } });
    }
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: "Update food failed" });
  }
};

export const deleteFood = async (req, res) => {
  await Food.findByIdAndDelete(req.params.id);
  res.json({ message: "Food deleted" });
};
