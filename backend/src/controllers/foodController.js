import Food from "../models/Food.js";
import Category from "../models/Category.js";

const getUploadedPath = (files, field) => files?.[field]?.[0]?.secure_url || files?.[field]?.[0]?.path || "";
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
  try {
    const { q } = req.query;
    if (!q) {
      const foods = await Food.find().sort({ createdAt: -1 }).lean();
      return res.json(foods);
    }

    const queryStr = String(q).trim().toLowerCase();
    
    // Split search query into tokens
    const tokens = queryStr.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      const foods = await Food.find().sort({ createdAt: -1 }).lean();
      return res.json(foods);
    }

    // Levenshtein helper on backend
    const levenshteinDistance = (s1, s2) => {
      if (s1 === s2) return 0;
      if (s1.length === 0) return s2.length;
      if (s2.length === 0) return s1.length;
      let v0 = new Array(s2.length + 1);
      let v1 = new Array(s2.length + 1);
      for (let i = 0; i < v0.length; i++) v0[i] = i;
      for (let i = 0; i < s1.length; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < s2.length; j++) {
          const cost = (s1[i] === s2[j]) ? 0 : 1;
          v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        }
        for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
      }
      return v0[s2.length];
    };

    const ALIASES = {
      "panir": "paneer",
      "panner": "paneer",
      "piza": "pizza",
      "burgar": "burger",
      "chiken": "chicken",
      "biryni": "biryani",
      "momos": "momo",
      "roll": "rolls",
      "roti": "nan",
      "nun": "nan",
      "naan": "nan",
      "dal": "daal"
    };

    // Build database query for candidates
    const dbQueryOrs = [];
    for (const t of tokens) {
      const regexList = [new RegExp(t, "i")];
      if (ALIASES[t]) {
        regexList.push(new RegExp(ALIASES[t], "i"));
      }
      dbQueryOrs.push({
        $or: [
          { name: { $in: regexList } },
          { category: { $in: regexList } },
          { categories: { $in: regexList } },
          { description: { $in: regexList } }
        ]
      });
    }

    // Retrieve candidate items matching the tokens
    const candidates = await Food.find({ $or: dbQueryOrs.map(cond => cond.$or).flat() }).lean();

    const scoredFoods = candidates.map(food => {
      const name = String(food.name || "").toLowerCase().trim();
      const desc = String(food.description || "").toLowerCase().trim();
      const categories = [food.category, ...(food.categories || [])]
        .map(c => String(c || "").toLowerCase().trim())
        .filter(Boolean);

      // Exact full string match
      if (name === queryStr) return { food, matches: true, score: 0 };
      if (name.startsWith(queryStr)) return { food, matches: true, score: 1 };
      if (categories.some(cat => cat.startsWith(queryStr))) return { food, matches: true, score: 2 };
      if (name.includes(queryStr)) return { food, matches: true, score: 3 };
      if (categories.some(cat => cat.includes(queryStr))) return { food, matches: true, score: 4 };

      let totalScore = 0;
      let matchesAll = true;

      for (const qToken of tokens) {
        let bestTokenScore = Infinity;
        const nameTokens = name.split(/\s+/).filter(Boolean);
        const catTokens = categories.flatMap(cat => cat.split(/\s+/).filter(Boolean));
        const targets = [...nameTokens, ...catTokens];

        for (const target of targets) {
          if (qToken === target) {
            bestTokenScore = Math.min(bestTokenScore, 0);
          } else if (target.startsWith(qToken)) {
            bestTokenScore = Math.min(bestTokenScore, 1);
          } else if (ALIASES[qToken] === target || ALIASES[target] === qToken) {
            bestTokenScore = Math.min(bestTokenScore, 2);
          } else if (target.includes(qToken)) {
            bestTokenScore = Math.min(bestTokenScore, 3);
          } else {
            const dist = levenshteinDistance(qToken, target);
            const maxAllowedDist = qToken.length >= 4 ? 2 : 1;
            if (dist <= maxAllowedDist) {
              bestTokenScore = Math.min(bestTokenScore, 4 + dist);
            }
          }
        }

        if (desc.includes(qToken)) {
          bestTokenScore = Math.min(bestTokenScore, 5);
        }

        if (bestTokenScore === Infinity) {
          matchesAll = false;
          break;
        } else {
          totalScore += bestTokenScore;
        }
      }

      const lengthPenalty = name.length * 0.01;
      if (matchesAll) {
        return { food, matches: true, score: 5 + totalScore + lengthPenalty };
      }
      return { food, matches: false, score: Infinity };
    });

    const results = scoredFoods
      .filter(item => item.matches)
      .sort((a, b) => a.score - b.score)
      .map(item => item.food);

    res.json(results);
  } catch (err) {
    console.error("Fuzzy search failed on backend:", err);
    res.status(500).json({ message: "Server error during search" });
  }
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
