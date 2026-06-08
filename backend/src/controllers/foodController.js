import Food from "../models/Food.js";

const getUploadedPath = (files, field) => files?.[field]?.[0]?.path || "";

export const getFoods = async (req, res) => {
  const foods = await Food.find().sort({ createdAt: -1 });
  res.json(foods);
};

export const addFood = async (req, res) => {
  try {
    const { name, price, description, category, categoryImageCurrent } = req.body;
    const foodImage = getUploadedPath(req.files, "image");
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    const nextCategoryImage = categoryImageUpload || categoryImageCurrent || "";

    const food = await Food.create({
      name,
      price,
      description,
      category,
      categoryImage: nextCategoryImage,
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
    const { name, price, description, category, categoryImageCurrent } = req.body;
    const categoryImageUpload = getUploadedPath(req.files, "categoryImage");
    let updateData = { name, price, description, category, categoryImage: categoryImageUpload || categoryImageCurrent || "" };
    
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
