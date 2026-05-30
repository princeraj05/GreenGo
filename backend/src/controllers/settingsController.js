import Settings from "../models/Settings.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({}); // Creates with default values
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { deliveryChargeAmount, isDeliveryChargeEnabled } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    settings.deliveryChargeAmount = deliveryChargeAmount;
    settings.isDeliveryChargeEnabled = isDeliveryChargeEnabled;
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
