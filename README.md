# 🍔 GreenGO - Premium SaaS Food Delivery Platform

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)

GreenGO is a state-of-the-art, production-ready, full-stack food delivery application similar to Zomato and Swiggy. It offers a premium SaaS layout with an ultra-responsive user interface, seamless order checkout cycles, delivery partner updates, and a comprehensive admin control dashboard. 

The project is natively compiled for mobile deployment on the Google Play Store using Capacitor Android while remaining fully functional as a high-performance live website.

---

## 👨‍💻 Creator & Maintainer

This project was created, designed, and is actively maintained by:
**Prince Raj** (Original Owner & Maintainer)
* GitHub: [@princeraj05](https://github.com/princeraj05)
* Last Build Sync: 2026-07-12T16:12:00Z (Triggering release update)

---

## ✨ Features

### 👤 User Panel Features
* **User Registration & Secure Login**: Simple JWT-based registration and login with token storage.
* **Profile Management**: Update user details, complete addresses, set passwords, and track user levels.
* **Browse Food Menu**: Premium UI to browse food categories (Starter, Combo, Main Course, Desserts, etc.).
* **Dynamic Time-Based Meal Categories**: Foods automatically filter "time-to-time" based on the current hour (Breakfast, Lunch, Dinner, or Anytime) matching admin settings.
* **Search Food Items**: Fast local searching and filtering by tags, veg/non-veg, and description.
* **Wishlist**: Save favorite foods to a personal collection for quick access.
* **Cart Management**: Add, update quantities, automatically calculate packing charges, and handle items dynamically.
* **Stripe-Inspired Checkout**: Fast, responsive checkout sheet with detailed order breakups.
* **Razorpay Payment Gateway**: Online payment integration for seamless credit/debit card, UPI, and net banking transactions.
* **Real-Time Order Tracking**: Visual step progress trackers (Pending, Preparing, Out for Delivery, Delivered).
* **Notification Center**: Real-time order status updates and alert feeds.
* **Dark / Light Mode Toggle**: Seamless visual toggles across all pages, including login.

### 🚴 Delivery Partner Panel Features
* **Delivery Partner Login**: Dedicated portal for delivery personnel.
* **Assigned Orders Tracker**: View real-time assigned orders with active delivery details.
* **Accept / Reject Flows**: Confirm or reject order deliveries dynamically.
* **Status Updates**: Update order milestones to "Out for Delivery" and "Delivered" with one click.
* **Earnings Dashboard**: Track lifetime completed deliveries, total tips, and payout statistics.
* **Delivery History**: Comprehensive log of all past deliveries.

### 🛠️ Admin Control Features
* **Premium Analytics Dashboard**: Clean charts (powered by Recharts) showing total sales, order statistics, user registration metrics, and active deliveries.
* **User Control & Moderation**: Monitor customer databases and toggle user active states.
* **Delivery Partner Management**: Add, verify, edit, and assign roles to delivery partners.
* **Product Management**: Create, edit, and delete food items with live image previews, combos, variants, spice configurations, and custom pricing.
* **Category Management**: Organize dishes and cuisines dynamically.
* **Order Fulfillment**: Track all global orders, update production states, and notify customers.
* **Global Notifications System**: Broadcast server-wide messages and alerts visible across the platform.

---

## 🛠️ Technology Stack

| Platform / Layer | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React.js (Vite) |
| **Styling Framework** | Tailwind CSS & Vanilla CSS Variables |
| **Backend Framework** | Node.js (Express.js) |
| **Database** | MongoDB (Mongoose ODM) |
| **Mobile Compilation** | Capacitor Android Wrapper |
| **State & Routes** | React Router DOM v7, React Context API |
| **Web Build Engine** | Rollup / Vite |

---

## 📂 Project Structure

```
ByteBite/ (Root Workspace)
├── backend/                  # Express.js & Node.js API Server
│   ├── src/
│   │   ├── config/           # Database & configuration settings
│   │   ├── controllers/      # Route controllers (Logic)
│   │   ├── middleware/       # JWT auth & role validation
│   │   ├── models/           # Mongoose schemas (User, Order, Food, etc.)
│   │   ├── routes/           # REST endpoint routers
│   │   ├── services/         # Mail & third-party services
│   │   └── index.js          # Backend entrance entrypoint
│   └── package.json
└── frontend/                 # React SPA & Capacitor Hybrid app
    ├── android/              # Native Android wrapper project
    ├── src/
    │   ├── api/              # Axios instance setup
    │   ├── components/       # Reusable layout & UI cards
    │   ├── context/          # State providers (Theme, Auth, etc.)
    │   ├── pages/            # View pages (User, Admin, Delivery)
    │   ├── utils/            # Helper functions (cn, getToken, etc.)
    │   ├── App.jsx           # App shell with routing
    │   └── main.jsx          # Entrypoint renderer
    ├── capacitor.config.json # Capacitor app config
    ├── tailwind.config.js    # Tailwind styling config
    └── package.json
```

---

## 📱 Mobile Platform & Production Builds

GreenGO runs on **Android 10, 11, 12, 13, 14, and newer**.

### Capacitor Sync Process
Before building native bundles, compile the React code and copy the assets to the Android platform folder:
```bash
# Inside the frontend folder
npm run build
npx cap sync
```

### Building Signed Production APK
To generate the release APK:
```bash
cd android
./gradlew clean assembleRelease
```
*Output Path*: `frontend/android/app/build/outputs/apk/release/app-release.apk`

### Building signed Android App Bundle (AAB)
To generate the AAB for Google Play Store upload:
```bash
cd android
./gradlew clean bundleRelease
```
*Output Path*: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/princeraj05/ByteBite.git
cd ByteBite
```

### 2. Configure Environment Variables

#### Backend Env (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/databaseName
JWT_SECRET=your_super_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
MAIL_FROM="GreenGO Support <your_email@gmail.com>"
```

#### Frontend Env (`frontend/.env`)
Create a `.env` file inside the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Install & Start Services

#### Run Backend
```bash
cd backend
npm install
npm run dev
```

#### Run Frontend Web App
```bash
cd ../frontend
npm install
npm run dev
```
Web interface will open at `http://localhost:5173`.

---

## 📸 Screenshots Placeholders

### User Panel & Menu
![User Panel Screenshot](https://via.placeholder.com/1200x675.png?text=GreenGO+User+Menu+Screen)

### Admin Portal & Analytics
![Admin Panel Screenshot](https://via.placeholder.com/1200x675.png?text=GreenGO+Admin+Dashboard+Screen)

### Delivery Partner Panel
![Delivery Panel Screenshot](https://via.placeholder.com/1200x675.png?text=GreenGO+Delivery+Partner+Screen)

### Mobile App View (Capacitor Android)
![Mobile App Mockup](https://via.placeholder.com/400x800.png?text=GreenGO+Capacitor+Android+View)

---

## 🛡️ License & Ownership

**Copyright © Prince Raj. All rights reserved.**

* This project is owned, maintained, and operated solely by **Prince Raj**.
* Unauthorized copying, resale, redistribution, modification claiming original ownership, or commercial exploitation of this project is strictly prohibited under applicable copyright laws.
