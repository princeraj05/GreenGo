import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ROUTE GUARDS */
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import DeliveryRoute from "./DeliveryRoute";

/* AUTH */
import AuthPage from "../pages/auth/AuthPage";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

/* USER */
import UserLayout from "../pages/user/UserLayout";
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const Menu = lazy(() => import("../pages/user/Menu"));
const Cart = lazy(() => import("../pages/user/Cart"));
const Checkout = lazy(() => import("../pages/user/Checkout"));
const Orders = lazy(() => import("../pages/user/Orders"));
const Profile = lazy(() => import("../pages/user/Profile"));
const UserContact = lazy(() => import("../pages/user/Contact"));
const Wishlist = lazy(() => import("../pages/user/Wishlist"));
const BudgetAssistantPage = lazy(() => import("../pages/user/BudgetAssistantPage"));
const Notifications = lazy(() => import("../pages/user/Notifications"));

/* DELIVERY */
import DeliveryLayout from "../pages/delivery/DeliveryLayout";
const DeliveryDashboard = lazy(() => import("../pages/delivery/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("../pages/delivery/DeliveryOrders"));
const DeliveryEarnings = lazy(() => import("../pages/delivery/DeliveryEarnings"));
const DeliveryProfile = lazy(() => import("../pages/delivery/DeliveryProfile"));

/* ADMIN */
import AdminLayout from "../pages/admin/AdminLayout";
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageFoods = lazy(() => import("../pages/admin/ManageFoods"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const Contacts = lazy(() => import("../pages/admin/Contacts"));
const ManageSettings = lazy(() => import("../pages/admin/ManageSettings"));
const ManageCoupons = lazy(() => import("../pages/admin/ManageCoupons"));
const ManageNotifications = lazy(() => import("../pages/admin/ManageNotifications"));
const FoodAnalytics = lazy(() => import("../pages/admin/FoodAnalytics"));
const ManageReviews = lazy(() => import("../pages/admin/ManageReviews"));
const ManageBanners = lazy(() => import("../pages/admin/ManageBanners"));

const SuspenseLoader = () => (
  <div className="flex justify-center items-center h-[60vh]">
    <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* PUBLIC AUTHENTICATION & REDIRECTS */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* USER PANEL */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/menu" replace />} />
          <Route path="menu" element={<Menu />} />
          <Route path="dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          <Route path="cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
          <Route path="contact" element={<PrivateRoute><UserContact /></PrivateRoute>} />
          <Route path="budget-assistant" element={<PrivateRoute><BudgetAssistantPage /></PrivateRoute>} />
          <Route path="notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        </Route>

        {/* DELIVERY BOY PANEL */}
        <Route
          path="/delivery"
          element={
            <PrivateRoute>
              <DeliveryRoute>
                <DeliveryLayout />
              </DeliveryRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<DeliveryDashboard />} />
          <Route path="orders" element={<DeliveryOrders />} />
          <Route path="earnings" element={<DeliveryEarnings />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="foods" element={<ManageFoods />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="settings" element={<ManageSettings />} />
          <Route path="coupons" element={<ManageCoupons />} />
          <Route path="notifications" element={<ManageNotifications />} />
          <Route path="analytics" element={<FoodAnalytics />} />
          <Route path="reviews" element={<ManageReviews />} />
          <Route path="banners" element={<ManageBanners />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
