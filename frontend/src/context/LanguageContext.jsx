import React, { createContext, useContext, useState } from 'react';

// English Translations
const en = {
  // Navigation / Sidebars
  "menu": "Menu",
  "wishlist": "Wishlist",
  "cart": "Cart",
  "orders": "Orders",
  "notifications": "Notifications",
  "contact": "Contact",
  "logout": "Logout",
  "dashboard": "Dashboard",
  "foods": "Foods",
  "categories": "Categories",
  "cancelled": "Cancelled",
  "users": "Users",
  "settings": "Settings",
  "logs": "Logs",
  "profile": "Profile",

  // Profile Page
  "edit_profile": "Edit Profile",
  "saved_addresses": "Saved Addresses",
  "favorite_foods": "My Favorite Foods",
  "privacy_security": "Privacy & Security",
  "session_management": "Session Management",
  "refer_earn": "Refer & Earn",
  "coupons": "Coupons",
  "suggestions": "Suggestions",
  "help_support": "Help & Support",
  "about_greengo": "About GreenGo",
  "about_developer": "About Developer",
  "language_settings": "Language Settings",

  // Order timeline & ETA
  "order_placed": "Order Placed",
  "restaurant_accepted": "Restaurant Accepted",
  "preparing": "Preparing",
  "delivery_partner_accepted": "Delivery Partner Accepted",
  "on_the_way": "On The Way",
  "delivered": "Delivered",
  "approx_time": "Approximate Time",
  "estimated_delivery": "Estimated Delivery",
  "payment": "Payment",
  "distance": "Distance",
  "total_amount": "Total Amount",
  "track_delivery": "Track Delivery",
  "cancel_order": "Cancel Order",
  "change_lang_desc": "Select your preferred language",
  "choose_lang": "Choose Language",
  "english": "English",
  "hindi": "Hindi (हिन्दी)"
};

// Hindi Translations
const hi = {
  // Navigation / Sidebars
  "menu": "मेन्यू",
  "wishlist": "इच्छा सूची",
  "cart": "कार्ट",
  "orders": "ऑर्डर्स",
  "notifications": "नोटिफिकेशन",
  "contact": "संपर्क करें",
  "logout": "लॉगआउट",
  "dashboard": "डैशबोर्ड",
  "foods": "व्यंजन",
  "categories": "श्रेणियाँ",
  "cancelled": "रद्द आर्डर",
  "users": "यूजर सूची",
  "settings": "सेटिंग्स",
  "logs": "लॉग्स",
  "profile": "प्रोफाइल",

  // Profile Page
  "edit_profile": "प्रोफ़ाइल बदलें",
  "saved_addresses": "सुरक्षित पते",
  "favorite_foods": "पसंदीदा भोजन",
  "privacy_security": "गोपनीयता और सुरक्षा",
  "session_management": "सत्र प्रबंधन",
  "refer_earn": "रेफर और कमाएं",
  "coupons": "कूपन्स",
  "suggestions": "सुझाव",
  "help_support": "सहायता एवं सहयोग",
  "about_greengo": "GreenGo के बारे में",
  "about_developer": "डेवलपर के बारे में",
  "language_settings": "भाषा सेटिंग्स",

  // Order timeline & ETA
  "order_placed": "ऑर्डर बुक हुआ",
  "restaurant_accepted": "रेस्तरां ने स्वीकारा",
  "preparing": "भोजन तैयार हो रहा है",
  "delivery_partner_accepted": "राइडर ने स्वीकारा",
  "on_the_way": "रास्ते में है",
  "delivered": "पहुंच गया",
  "approx_time": "अनुमानित समय",
  "estimated_delivery": "अनुमानित डिलीवरी",
  "payment": "भुगतान",
  "distance": "दूरी",
  "total_amount": "कुल राशि",
  "track_delivery": "ट्रैक डिलीवरी",
  "cancel_order": "ऑर्डर रद्द करें",
  "change_lang_desc": "अपनी पसंदीदा भाषा चुनें",
  "choose_lang": "भाषा चुनें",
  "english": "English",
  "hindi": "हिन्दी (Hindi)"
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    const dictionary = language === 'hi' ? hi : en;
    return dictionary[key] || en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
