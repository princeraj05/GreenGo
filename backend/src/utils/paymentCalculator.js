import Food from "../models/Food.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import Order from "../models/Order.js";

// Helper function to calculate Haversine distance
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to match distance slab amounts
export const getSlabAmount = (slabs = [], distance = null, fallback = 0, isCod = false) => {
  const km = Number(distance || 0);
  const sortedSlabs = Array.isArray(slabs)
    ? slabs
        .map((slab) => ({
          upToKm: Number(slab?.upToKm || 0),
          amount: Number(slab?.amount || 0),
          cod: slab?.cod !== undefined ? Boolean(slab.cod) : true,
          online: slab?.online !== undefined ? Boolean(slab.online) : true,
        }))
        .filter((slab) => {
          if (slab.upToKm <= 0) return false;
          return isCod ? slab.cod : slab.online;
        })
        .sort((a, b) => a.upToKm - b.upToKm)
    : [];
  if (!sortedSlabs.length || !Number.isFinite(km) || km <= 0) return Number(fallback || 0);
  const matchedSlab = sortedSlabs.find((slab) => km <= slab.upToKm) || sortedSlabs[sortedSlabs.length - 1];
  return Number(matchedSlab?.amount || 0);
};

/**
 * Main backend pricing calculator function.
 * Validates stock, availability, coupon rules, delivery coordinates, and store status.
 */
export async function calculateOrderAmount({ userId, items, address, latitude, longitude, paymentMethod, couponCode }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart items are required.");
  }

  const isCod = String(paymentMethod).toUpperCase() === "COD";

  // 1. Fetch Store Settings & validate store open status
  const settings = await Settings.findOne().lean();
  if (settings && settings.isStoreOpen === false) {
    throw new Error("Restaurant is closed and not accepting orders.");
  }

  // 2. Validate products and calculate subtotal & packing charge
  let subtotal = 0;
  let packingTotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const rawFoodId = item.foodId || String(item._id).split(":")[0];
    const food = await Food.findById(rawFoodId);

    if (!food) {
      throw new Error(`Product not found: ${item.name || 'Unknown'}`);
    }

    if (!food.isAvailable || food.availableQty <= 0) {
      throw new Error(`Product is currently unavailable: ${food.name}`);
    }

    if (food.availableQty < item.qty) {
      throw new Error(`Insufficient stock for ${food.name}. Only ${food.availableQty} available.`);
    }

    // Determine correct price based on variant or base price
    let resolvedPrice = food.price;
    if (item.variantName) {
      const matchedVariant = food.variants.find(
        (v) => String(v.name).trim().toLowerCase() === String(item.variantName).trim().toLowerCase()
      );
      if (!matchedVariant) {
        throw new Error(`Invalid variant "${item.variantName}" for product ${food.name}`);
      }
      resolvedPrice = matchedVariant.price;
    }

    subtotal += resolvedPrice * item.qty;
    packingTotal += (food.packingCharge || 0) * item.qty;

    validatedItems.push({
      foodId: food._id,
      name: food.name,
      price: resolvedPrice,
      packingCharge: food.packingCharge || 0,
      qty: item.qty,
      image: food.image,
      variantName: item.variantName || ""
    });
  }

  // 3. Distance & Delivery Fee Calculation
  let distance = null;
  let finalDeliveryCharge = 0;
  let deliveryBoyAmount = 0;

  let userLat = latitude;
  let userLon = longitude;

  if (settings) {
    if (userLat !== undefined && userLat !== null && userLon !== undefined && userLon !== null) {
      distance = calculateHaversineDistance(
        settings.storeLatitude,
        settings.storeLongitude,
        userLat,
        userLon
      );

      // Verify delivery distance limit if enabled
      if (settings.isDistanceLimitEnabled && distance > settings.maxDeliveryDistance) {
        throw new Error(
          `Delivery location (${distance.toFixed(1)} km) exceeds our maximum delivery distance of ${settings.maxDeliveryDistance} km.`
        );
      }

      finalDeliveryCharge = settings.isDeliveryChargeEnabled
        ? getSlabAmount(settings.deliveryChargeSlabs, distance, settings.deliveryChargeAmount, isCod)
        : 0;
      deliveryBoyAmount = getSlabAmount(settings.deliveryBoyAmountSlabs, distance, 0);
    } else {
      // Coordinates missing
      finalDeliveryCharge = settings.isDeliveryChargeEnabled ? Number(settings.deliveryChargeAmount || 0) : 0;
    }
  }

  // 4. Surcharges (Rain, Festival, Platform, Custom Surcharges)
  let rainCharge = 0;
  let festivalCharge = 0;
  let platformCharge = 0;
  let surchargesAmount = 0;
  const appliedSurcharges = [];

  if (settings) {
    rainCharge = Number(settings.rainCharge || 0);
    festivalCharge = Number(settings.festivalCharge || 0);
    platformCharge = Number(settings.platformCharge || 0);

    if (Array.isArray(settings.surcharges)) {
      settings.surcharges.forEach((s) => {
        const isAllowed = isCod ? s.cod : s.online;
        if (isAllowed) {
          surchargesAmount += Number(s.amount || 0);
          appliedSurcharges.push({
            name: s.name,
            amount: Number(s.amount || 0),
          });
        }
      });
    }
  }

  // 5. Coupon Discount Validation
  let finalDiscount = 0;
  let validCouponCode = "";

  if (couponCode) {
    const cleanCode = String(couponCode).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      throw new Error("Invalid coupon code.");
    }

    if (!coupon.active) {
      throw new Error("Coupon is inactive.");
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      throw new Error("Coupon has expired.");
    }

    if (subtotal < coupon.minimumOrder) {
      throw new Error(`Minimum order amount of ₹${coupon.minimumOrder} is required for this coupon.`);
    }

    if (coupon.userId && String(coupon.userId) !== String(userId)) {
      throw new Error("This coupon is not valid for your account.");
    }

    // Check if the user already used this coupon code in a completed order
    const priorUses = await Order.countDocuments({
      userId,
      couponCode: cleanCode,
      paymentStatus: { $in: ["Paid", "Pending"] },
      status: { $ne: "Cancelled" }
    });

    if (priorUses > 0) {
      throw new Error("You have already used this coupon.");
    }

    if (coupon.discountType === "percentage") {
      finalDiscount = Math.round((subtotal * coupon.discountValue) / 100);
    } else {
      finalDiscount = coupon.discountValue;
    }

    validCouponCode = cleanCode;
  }

  // 6. Calculate Final Total
  const finalTotal = Math.max(
    0,
    subtotal +
      packingTotal +
      finalDeliveryCharge +
      rainCharge +
      festivalCharge +
      platformCharge +
      surchargesAmount -
      finalDiscount
  );

  return {
    subtotal,
    packingTotal,
    deliveryCharge: finalDeliveryCharge,
    deliveryBoyAmount,
    rainCharge,
    festivalCharge,
    platformCharge,
    surcharges: appliedSurcharges,
    surchargesAmount,
    couponDiscount: finalDiscount,
    couponCode: validCouponCode,
    total: finalTotal,
    distance: distance ? Number(distance.toFixed(2)) : null,
    items: validatedItems
  };
}
