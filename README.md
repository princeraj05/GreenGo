<div align="center">
  <img src="https://img.shields.io/badge/Byte-Bite-orange?style=for-the-badge&logo=burgerking&logoColor=white" alt="ByteBite Logo" />
  
  <h1>🍔 ByteBite - Premium Food Delivery Platform</h1>
  <p>A full-stack MERN application for seamless food ordering with an ultra-premium user interface.</p>

  <p>
    <a href="#live-demo"><strong>View Live Demo (Coming Soon)</strong></a> ·
    <a href="#features"><strong>Explore Features</strong></a> ·
    <a href="#installation"><strong>Installation Guide</strong></a>
  </p>

  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

<br />

## 🌟 Overview
ByteBite is a highly-polished, full-stack food delivery application built using the MERN stack. It features a seamless, modern, and engaging user interface powered by Tailwind CSS. The platform is designed to provide a premium experience for both customers ordering food and administrators managing the restaurant.

### 🔗 Live Demo
> **Live Link:** [Add your deployed Vercel/Netlify link here]

---

## 📸 Screenshots
*(Add screenshots of your project here by replacing the placeholders)*

### 📱 User Dashboard & Public Pages
<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Home+Page+Screenshot" alt="Home Page" width="48%" />
  <img src="https://via.placeholder.com/800x450.png?text=User+Dashboard+Screenshot" alt="User Dashboard" width="48%" />
</p>

### 🛠️ Admin Control Panel
<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Admin+Dashboard+Screenshot" alt="Admin Dashboard" width="48%" />
  <img src="https://via.placeholder.com/800x450.png?text=Manage+Foods+Screenshot" alt="Manage Foods" width="48%" />
</p>

---

## ✨ Features

### For Customers (User Panel)
- **Beautiful UI:** Modern, responsive design with smooth gradients and glassmorphism.
- **Dynamic Cart & Checkout:** Seamless add-to-cart functionality with automatic redirection to a beautiful checkout page.
- **Payment Selection:** Mock payment integration supporting COD, UPI, and Card.
- **Order Tracking:** Real-time status updates (Pending, Preparing, Delivered).

### For Administrators (Admin Panel)
- **Premium Dashboard:** High-end dark slate and glowing emerald theme for tracking revenue, orders, and users.
- **Food Management:** Add, edit, and delete menu items with **live image previews**.
- **Order Fulfillment:** Update order statuses and set live ETAs for customers.
- **User Control:** Monitor registered users, handle support messages, and block/unblock accounts.

---

## 🚀 Installation & Setup

Follow these steps to run ByteBite locally on your machine.

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local instance or MongoDB Atlas cluster)

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
