import Settings from "../models/Settings.js";

const normalizeSlabs = (slabs) => {
  if (!Array.isArray(slabs)) return [];
  return slabs
    .map((slab) => ({
      upToKm: Number(slab?.upToKm || 0),
      amount: Number(slab?.amount || 0),
    }))
    .filter((slab) => slab.upToKm > 0 && slab.amount >= 0)
    .sort((a, b) => a.upToKm - b.upToKm);
};

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
    const { 
      deliveryChargeAmount, 
      isDeliveryChargeEnabled,
      deliveryChargeSlabs,
      deliveryBoyAmountSlabs,
      maxDeliveryDistance,
      storeLatitude,
      storeLongitude,
      isDistanceLimitEnabled,
      isStoreOpen
    } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    settings.deliveryChargeAmount = deliveryChargeAmount;
    settings.isDeliveryChargeEnabled = isDeliveryChargeEnabled;
    if (deliveryChargeSlabs !== undefined) settings.deliveryChargeSlabs = normalizeSlabs(deliveryChargeSlabs);
    if (deliveryBoyAmountSlabs !== undefined) settings.deliveryBoyAmountSlabs = normalizeSlabs(deliveryBoyAmountSlabs);
    if (maxDeliveryDistance !== undefined) settings.maxDeliveryDistance = Number(maxDeliveryDistance);
    if (storeLatitude !== undefined) settings.storeLatitude = Number(storeLatitude);
    if (storeLongitude !== undefined) settings.storeLongitude = Number(storeLongitude);
    if (isDistanceLimitEnabled !== undefined) settings.isDistanceLimitEnabled = Boolean(isDistanceLimitEnabled);
    if (isStoreOpen !== undefined) settings.isStoreOpen = Boolean(isStoreOpen);
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
