import Food from "../models/Food.js";

const categoryImages = {
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
  Biryani: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&q=80&w=600",
  Rolls: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=600",
  Fries: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=600",
  "North Indian": "https://images.unsplash.com/photo-1583939411023-14783179e581?auto=format&fit=crop&q=80&w=600",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=600",
  Bowl: "https://images.unsplash.com/photo-1543353071-087092ec393a?auto=format&fit=crop&q=80&w=600",
  "Veg Meal": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
  Paneer: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600",
  Paratha: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600",
  Sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
  Rice: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=600",
  Cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600",
  Dal: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
  Thali: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
  Pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600",
  Drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=600",
  Starter: "https://images.unsplash.com/photo-1601050690117-64b6aa8e97e8?auto=format&fit=crop&q=80&w=600",
  Combo: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600",
  Roti: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600",
  "Non-Veg": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=600",
};

const foods = [
  ["Margherita Pizza", 149, "Pizza", true, "Cheesy veg pizza with tomato basil sauce.", 4.5, 320],
  ["Veg Burger", 100, "Burger", true, "Crispy veggie patty with fresh lettuce and sauces.", 4.3, 150],
  ["Chicken Biryani", 189, "Biryani", false, "Aromatic rice layered with spiced chicken.", 4.5, 180],
  ["Chicken Roll", 120, "Rolls", false, "Spiced chicken wrapped in soft roomali roti.", 4.6, 320],
  ["Masala Fries", 79, "Fries", true, "Crispy fries tossed with Indian masala.", 4.2, 130],
  ["North Indian Platter", 229, "North Indian", true, "Dal, sabzi, roti, rice, salad, and pickle.", 4.4, 210],
  ["Chocolate Cake", 99, "Desserts", true, "Soft chocolate pastry with rich ganache.", 4.4, 170],
  ["Paneer Bowl", 179, "Bowl", true, "Paneer tikka, rice, veggies, and creamy dip.", 4.3, 140],
  ["Veg Meal", 199, "Veg Meal", true, "Balanced homestyle meal with rice, dal, roti, and sabzi.", 4.5, 260],
  ["Paneer Butter Masala", 189, "Paneer", true, "Paneer cubes in buttery tomato gravy.", 4.6, 290],
  ["Aloo Paratha", 89, "Paratha", true, "Stuffed paratha served with curd and pickle.", 4.4, 240],
  ["Club Sandwich", 119, "Sandwich", true, "Layered veg sandwich with cheese and chutney.", 4.2, 110],
  ["Steamed Rice", 69, "Rice", true, "Fluffy long grain rice.", 4.1, 80],
  ["Dal Tadka", 99, "Dal", true, "Yellow dal tempered with cumin, garlic, and ghee.", 4.4, 190],
  ["Special Thali", 249, "Thali", true, "Complete thali with roti, rice, dal, sabzi, sweets, and salad.", 4.7, 360],
  ["Hakka Noodles", 140, "Pasta", true, "Wok tossed noodles with crunchy vegetables.", 4.4, 210],
  ["Cold Coffee", 89, "Drinks", true, "Chilled coffee with creamy froth.", 4.3, 160],
  ["Chana Salad", 109, "Starter", true, "Protein rich chana salad with fresh herbs.", 4.2, 120],
  ["Value Combo", 199, "Combo", true, "Burger, fries, and drink combo.", 4.3, 170],
  ["Tandoori Roti", 25, "Roti", true, "Freshly baked tandoori roti.", 4.1, 90],
  ["Butter Chicken", 229, "Non-Veg", false, "Tender chicken in creamy butter gravy.", 4.6, 280],
];

export const seedInitialFoods = async () => {
  try {
    const count = await Food.countDocuments();
    if (count > 0) {
      console.log("Foods database already has data. Skipping seed.");
      return;
    }

    const docs = foods.map(([name, price, category, veg, description, rating, ratingCount], index) => ({
      name,
      price,
      category,
      veg,
      description,
      rating,
      ratingCount,
      totalOrders: ratingCount,
      popularityScore: rating * 10 + ratingCount,
      categoryImage: categoryImages[category] || categoryImages.Starter,
      image: categoryImages[category] || categoryImages.Starter,
      featured: index < 6,
    }));

    await Food.insertMany(docs);
    console.log("Initial foods seeded successfully.");
  } catch (error) {
    console.error("Failed to seed initial foods:", error);
  }
};
