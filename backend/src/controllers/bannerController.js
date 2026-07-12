import Banner from "../models/Banner.js";

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get all banners (Admin)
// @route   GET /api/admin/banners
// @access  Private/Admin
export const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Add a banner
// @route   POST /api/admin/banners
// @access  Private/Admin
export const addBanner = async (req, res) => {
  console.log("[BANNER DEBUG] addBanner initiated. req.body:", req.body);
  console.log("[BANNER DEBUG] req.file:", req.file);
  try {
    const { title, description, discountText, buttonText, displayOrder, active, targetCategory } = req.body;
    let image = "";
    if (req.file) {
      image = req.file.secure_url || req.file.path || req.file.filename;
    } else {
      console.log("[BANNER DEBUG] No file uploaded in req.file");
      return res.status(400).json({ message: "Please upload an image for the banner" });
    }

    const banner = await Banner.create({
      title,
      description,
      discountText,
      buttonText,
      image,
      displayOrder: Number(displayOrder || 0),
      active: active === "false" ? false : true,
      targetCategory: targetCategory || ""
    });

    console.log("[BANNER DEBUG] Banner created successfully:", banner._id);
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    console.error("[BANNER DEBUG] Error in addBanner:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
  console.log("[BANNER DEBUG] updateBanner initiated. req.body:", req.body);
  console.log("[BANNER DEBUG] req.file:", req.file);
  try {
    const { title, description, discountText, buttonText, displayOrder, active, targetCategory } = req.body;
    let banner = await Banner.findById(req.params.id);
    if (!banner) {
      console.log("[BANNER DEBUG] Banner not found with ID:", req.params.id);
      return res.status(404).json({ message: "Banner not found" });
    }

    const updateData = {
      title,
      description,
      discountText,
      buttonText,
      displayOrder: Number(displayOrder || 0),
      active: active === "false" ? false : true,
      targetCategory: targetCategory || ""
    };

    if (req.file) {
      updateData.image = req.file.secure_url || req.file.path || req.file.filename;
    }

    banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    console.log("[BANNER DEBUG] Banner updated successfully:", banner._id);
    res.json({ success: true, data: banner });
  } catch (err) {
    console.error("[BANNER DEBUG] Error in updateBanner:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    await banner.deleteOne();
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
