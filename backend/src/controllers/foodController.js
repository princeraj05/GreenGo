import Food from "../models/Food.js";
import Category from "../models/Category.js";

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
const normalizeCategories = (categories, category = "") => {
  const parsedCategories = parseJsonArray(categories);
  const fallbackCategories = String(category || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([...parsedCategories, ...fallbackCategories]
    .map((item) => String(item || "").trim())
    .filter(Boolean))];
};
const normalizeVariants = (value, basePrice = 0) => parseJsonArray(value)
  .map((variant) => {
    if (typeof variant === "string") {
      return { name: variant, price: toNumber(basePrice, 0) };
    }
    return {
      name: String(variant?.name || "").trim(),
      price: toNumber(variant?.price, basePrice),
    };
  })
  .filter((variant) => variant.name);
const normalizeComboItems = (value) => parseJsonArray(value)
  .map((item) => ({
    name: String(item?.name || "").trim(),
    price: Math.max(0, toNumber(item?.price, 0)),
  }))
  .filter((item) => item.name);
const normalizeLevel = (value, fallback = "Medium") => {
  const next = String(value || "").trim();
  return ["Small", "Medium", "Hard"].includes(next) ? next : fallback;
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
      originalPrice,
      description,
      category,
      categories,
      categoryImageCurrent,
      veg,
      foodType,
      mealCategory,
      servingSize,
      packingCharge,
      variants,
      comboItems,
      preparationTime,
      spiceLevel,
      sizeLevel,
      isAvailable,
      availableQty
    } = req.body;
    const foodImage = getUploadedPath(req.files, "image");
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    const nextCategoryImage = categoryImageUpload || categoryImageCurrent || "";

    const nextCategories = normalizeCategories(categories, category);

    // Validate that if the food is non-veg, none of its categories are Veg or Egg
    const foodVeg = toBoolean(veg, true);
    if (!foodVeg) {
      const categoriesToCheck = await Category.find({ name: { $in: nextCategories } });
      for (const cat of categoriesToCheck) {
        if (cat.foodType === "Veg" || cat.foodType === "Egg") {
          return res.status(400).json({ message: `Category "${cat.name}" is Veg/Egg only. Cannot add Non-Veg item.` });
        }
      }
    }

    const food = await Food.create({
      name,
      price: toNumber(price),
      originalPrice: toNumber(originalPrice || 0),
      description,
      category: nextCategories[0] || category || "",
      categories: nextCategories,
      categoryImage: nextCategoryImage,
      veg: toBoolean(veg, true),
      foodType: foodType === "combo" ? "combo" : "single",
      mealCategory: mealCategory || "Anytime",
      servingSize: Math.max(1, Math.ceil(toNumber(servingSize, 1))),
      packingCharge: Math.max(0, toNumber(packingCharge, 0)),
      variants: normalizeVariants(variants, price),
      comboItems: normalizeComboItems(comboItems),
      preparationTime: preparationTime || "15 - 20 min",
      spiceLevel: normalizeLevel(spiceLevel),
      sizeLevel: normalizeLevel(sizeLevel),
      isAvailable: toBoolean(isAvailable, true),
      availableQty: availableQty !== undefined ? toNumber(availableQty, 10) : 10,
      image: foodImage, // Save the full Cloudinary URL
    });

    if (categoryImageUpload && nextCategories.length) {
      await Food.updateMany(
        { $or: [{ category: { $in: nextCategories } }, { categories: { $in: nextCategories } }] },
        { $set: { categoryImage: categoryImageUpload } }
      );
    }

    res.status(201).json(food);
  } catch (err) {
    console.error("Add food error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE FOOD
export const updateFood = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      description,
      category,
      categories,
      categoryImageCurrent,
      veg,
      featured,
      foodType,
      mealCategory,
      servingSize,
      packingCharge,
      variants,
      comboItems,
      preparationTime,
      spiceLevel,
      sizeLevel,
      isAvailable,
      availableQty
    } = req.body;
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = toNumber(price);
    if (originalPrice !== undefined) updateData.originalPrice = toNumber(originalPrice);
    if (description !== undefined) updateData.description = description;
    const nextCategories = categories !== undefined || category !== undefined
      ? normalizeCategories(categories, category)
      : [];

    // Validate that if the food is non-veg, none of its categories are Veg or Egg
    let finalVeg = true;
    if (veg !== undefined) {
      finalVeg = toBoolean(veg, true);
    } else {
      const currentFood = await Food.findById(req.params.id);
      if (currentFood) {
        finalVeg = currentFood.veg !== false;
      }
    }
    
    if (!finalVeg) {
      let finalCategories = nextCategories;
      if (categories === undefined && category === undefined) {
        const currentFood = await Food.findById(req.params.id);
        if (currentFood) {
          finalCategories = currentFood.categories || [currentFood.category];
        }
      }
      const categoriesToCheck = await Category.find({ name: { $in: finalCategories } });
      for (const cat of categoriesToCheck) {
        if (cat.foodType === "Veg" || cat.foodType === "Egg") {
          return res.status(400).json({ message: `Category "${cat.name}" is Veg/Egg only. Cannot save Non-Veg item here.` });
        }
      }
    }
    if (category !== undefined || categories !== undefined) {
      updateData.category = nextCategories[0] || category || "";
      updateData.categories = nextCategories;
    }
    if (categoryImageUpload || categoryImageCurrent !== undefined) {
      updateData.categoryImage = categoryImageUpload || categoryImageCurrent || "";
    }
    if (veg !== undefined) updateData.veg = toBoolean(veg, true);
    if (featured !== undefined) updateData.featured = toBoolean(featured, false);
    if (isAvailable !== undefined) updateData.isAvailable = toBoolean(isAvailable, true);
    if (availableQty !== undefined) updateData.availableQty = toNumber(availableQty, 10);
    if (foodType !== undefined) updateData.foodType = foodType === "combo" ? "combo" : "single";
    if (mealCategory !== undefined) updateData.mealCategory = mealCategory || "Anytime";
    if (servingSize !== undefined) updateData.servingSize = Math.max(1, Math.ceil(toNumber(servingSize, 1)));
    if (packingCharge !== undefined) updateData.packingCharge = Math.max(0, toNumber(packingCharge, 0));
    if (variants !== undefined) updateData.variants = normalizeVariants(variants, price ?? req.body.price);
    if (comboItems !== undefined) updateData.comboItems = normalizeComboItems(comboItems);
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime || "15 - 20 min";
    if (spiceLevel !== undefined) updateData.spiceLevel = normalizeLevel(spiceLevel);
    if (sizeLevel !== undefined) updateData.sizeLevel = normalizeLevel(sizeLevel);
    
    const foodImage = getUploadedPath(req.files, "image");
    if (foodImage) {
      updateData.image = foodImage; // Update with new Cloudinary URL
    }

    const food = await Food.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (categoryImageUpload && nextCategories.length) {
      await Food.updateMany(
        { $or: [{ category: { $in: nextCategories } }, { categories: { $in: nextCategories } }] },
        { $set: { categoryImage: categoryImageUpload } }
      );
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
