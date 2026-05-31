<div align="center">
  <img src="https://img.shields.io/badge/Byte-Bite-FF5A00?style=for-the-badge&logo=doordash&logoColor=white" alt="ByteBite Logo" />
  
  <h1>🍔 ByteBite - Premium SaaS Food Delivery Platform</h1>
  <p>A production-ready full-stack MERN application for seamless food ordering with an ultra-premium, mobile-responsive user interface.</p>

  <p>
    <a href="#live-demo"><strong>View Live Demo</strong></a> ·
    <a href="#features"><strong>Explore Features</strong></a> ·
    <a href="#installation"><strong>Installation Guide</strong></a>
  </p>

  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Framer Motion](https://img.shields.io/badge/framer--motion-%230055FF.svg?style=for-the-badge&logo=framer&logoColor=white)
</div>

<br />

## 🌟 Overview
ByteBite is a highly-polished, full-stack food delivery application built using the MERN stack. Recently redesigned with a **Stripe/Apple-inspired premium aesthetic**, it features a seamless, modern, and engaging user interface powered by Tailwind CSS, Lucide Icons, and Framer Motion for buttery-smooth animations. 

The platform is designed to provide a premium experience for both customers ordering food and administrators managing the restaurant. It is completely **mobile-responsive**, performant (with React lazy loading), and highly accessible.

### 🔗 Live Demo
> **Live Link:** [Add your deployed Vercel/Netlify link here]

---

## 📸 Screenshots
*(Add screenshots of your project here by replacing the placeholders)*

### 📱 User Dashboard & Public Pages
<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Home+Page+Screenshot" alt="Home Page" width="48%" />
  <img src="https://via.placeholder.com/800x450.png?text=User+Menu+Screenshot" alt="User Menu" width="48%" />
</p>

### 🛠️ Admin Control Panel
<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Admin+Dashboard+Screenshot" alt="Admin Dashboard" width="48%" />
  <img src="https://via.placeholder.com/800x450.png?text=Manage+Orders+Screenshot" alt="Manage Orders" width="48%" />
</p>

---

## ✨ Features

### For Customers (User Panel)
- **Ultra-Premium UI:** Modern, fully mobile-responsive design with glassmorphism, soft drop shadows, and refined typography.
- **Fluid Animations:** Powered by `framer-motion` for page transitions, hover effects, and interactive feedback.
- **Dynamic Cart & Secure Checkout:** Seamless add-to-cart functionality with automatic redirection to a beautiful, Stripe-like checkout page.
- **Payment Integration:** Ready for Razorpay (Card, UPI) and Cash on Delivery integration.
- **Order Tracking:** Real-time visual status updates (Pending, Preparing, Out for Delivery, Delivered) with dynamic progress bars.

### For Administrators (Admin Panel)
- **SaaS-Quality Dashboard:** High-end dark sidebar and clean dashboard for tracking revenue, orders, and users with interactive Recharts.
- **Food Management:** Add, edit, and delete menu items with **live image previews** and featured toggles.
- **Order Fulfillment:** Update order statuses and set live ETAs for customers with a single click.
- **User Control:** Monitor registered users, handle support messages, and securely block/unblock accounts.

### Performance Enhancements
- **Route Splitting:** Implemented `React.lazy()` and `Suspense` for faster initial page loads.
- **Custom UI Components:** Extracted reusable `Button`, `Card`, `Input`, and `Badge` components wrapped with `tailwind-merge` (`cn` utility) for clean code.

---

## 🚀 Installation & Setup

Follow these steps to run ByteBite locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)
- Razorpay API Keys (Optional, for payment gateway)

### 1. Clone the Repository
```bash
git clone https://github.com/princeraj05/ByteBite.git
cd ByteBite
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the frontend server:
```bash
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 👨‍💻 Developer
Developed with ❤️ by **Prince Raj**
- GitHub: [@princeraj05](https://github.com/princeraj05)
