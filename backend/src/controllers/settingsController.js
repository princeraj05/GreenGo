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

const normalizeDeliverySlabs = (slabs) => {
  if (!Array.isArray(slabs)) return [];
  return slabs
    .map((slab) => ({
      upToKm: Number(slab?.upToKm || 0),
      amount: Number(slab?.amount || 0),
      cod: slab?.cod !== undefined ? Boolean(slab.cod) : true,
      online: slab?.online !== undefined ? Boolean(slab.online) : true,
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
      isStoreOpen,
      rainCharge,
      festivalCharge,
      platformCharge,
      enabledPaymentMethods,
      surcharges,
      referralRewardFriend,
      referralRewardReferrer,
      minOrderAmount,
      isBirthdayOfferEnabled,
      birthdayCouponAmount
    } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    settings.deliveryChargeAmount = deliveryChargeAmount;
    settings.isDeliveryChargeEnabled = isDeliveryChargeEnabled;
    if (deliveryChargeSlabs !== undefined) settings.deliveryChargeSlabs = normalizeDeliverySlabs(deliveryChargeSlabs);
    if (deliveryBoyAmountSlabs !== undefined) settings.deliveryBoyAmountSlabs = normalizeSlabs(deliveryBoyAmountSlabs);
    if (maxDeliveryDistance !== undefined) settings.maxDeliveryDistance = Number(maxDeliveryDistance);
    if (storeLatitude !== undefined) settings.storeLatitude = Number(storeLatitude);
    if (storeLongitude !== undefined) settings.storeLongitude = Number(storeLongitude);
    if (isDistanceLimitEnabled !== undefined) settings.isDistanceLimitEnabled = Boolean(isDistanceLimitEnabled);
    if (isStoreOpen !== undefined) settings.isStoreOpen = Boolean(isStoreOpen);
    
    if (rainCharge !== undefined) settings.rainCharge = Number(rainCharge);
    if (festivalCharge !== undefined) settings.festivalCharge = Number(festivalCharge);
    if (platformCharge !== undefined) settings.platformCharge = Number(platformCharge);
    if (surcharges !== undefined) {
      if (Array.isArray(surcharges)) {
        settings.surcharges = surcharges
          .map((s) => ({
            name: String(s?.name || "").trim(),
            amount: Number(s?.amount || 0),
            cod: s?.cod !== undefined ? Boolean(s.cod) : true,
            online: s?.online !== undefined ? Boolean(s.online) : true,
          }))
          .filter((s) => s.name !== "" && s.amount >= 0);
      } else {
        settings.surcharges = [];
      }
    }
    if (enabledPaymentMethods !== undefined) {
      settings.enabledPaymentMethods = {
        cod: Boolean(enabledPaymentMethods.cod),
        online: Boolean(enabledPaymentMethods.online)
      };
    }
    if (referralRewardFriend !== undefined) settings.referralRewardFriend = Number(referralRewardFriend);
    if (referralRewardReferrer !== undefined) settings.referralRewardReferrer = Number(referralRewardReferrer);
    if (minOrderAmount !== undefined) settings.minOrderAmount = Number(minOrderAmount);
    if (isBirthdayOfferEnabled !== undefined) settings.isBirthdayOfferEnabled = Boolean(isBirthdayOfferEnabled);
    if (birthdayCouponAmount !== undefined) settings.birthdayCouponAmount = Number(birthdayCouponAmount);
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
