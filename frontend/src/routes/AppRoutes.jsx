import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ROUTE GUARDS */
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import DeliveryRoute from "./DeliveryRoute";
import ProfileCompletionRoute from "./ProfileCompletionRoute";

/* AUTH */
const AuthPage = lazy(() => import("../pages/auth/AuthPage"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));

/* USER */
const UserLayout = lazy(() => import("../pages/user/UserLayout"));
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const Menu = lazy(() => import("../pages/user/Menu"));
const FoodSearch = lazy(() => import("../pages/user/FoodSearch"));
const Cart = lazy(() => import("../pages/user/Cart"));
const Checkout = lazy(() => import("../pages/user/Checkout"));
const Orders = lazy(() => import("../pages/user/Orders"));
const Profile = lazy(() => import("../pages/user/Profile"));
const UserContact = lazy(() => import("../pages/user/Contact"));
const Wishlist = lazy(() => import("../pages/user/Wishlist"));
const BudgetAssistantPage = lazy(() => import("../pages/user/BudgetAssistantPage"));
const Notifications = lazy(() => import("../pages/user/Notifications"));
const OrderTrackingPage = lazy(() => import("../pages/common/OrderTrackingPage"));

/* DELIVERY */
const DeliveryLayout = lazy(() => import("../pages/delivery/DeliveryLayout"));
const DeliveryDashboard = lazy(() => import("../pages/delivery/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("../pages/delivery/DeliveryOrders"));
const DeliveryEarnings = lazy(() => import("../pages/delivery/DeliveryEarnings"));
const DeliveryProfile = lazy(() => import("../pages/delivery/DeliveryProfile"));

/* ADMIN */
const AdminLayout = lazy(() => import("../pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageFoods = lazy(() => import("../pages/admin/ManageFoods"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));
const CustomerUsers = lazy(() => import("../pages/admin/users/CustomerUsers"));
const DeliveryBoyUsers = lazy(() => import("../pages/admin/users/DeliveryBoyUsers"));
const Contacts = lazy(() => import("../pages/admin/Contacts"));
const ManageSettings = lazy(() => import("../pages/admin/ManageSettings"));
const ManageCoupons = lazy(() => import("../pages/admin/ManageCoupons"));
const ManageNotifications = lazy(() => import("../pages/admin/ManageNotifications"));
const FoodAnalytics = lazy(() => import("../pages/admin/FoodAnalytics"));
const ManageReviews = lazy(() => import("../pages/admin/ManageReviews"));
const ManageBanners = lazy(() => import("../pages/admin/ManageBanners"));

const SuspenseLoader = () => (
  <div className="min-h-[60vh] px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="h-12 w-48 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
        <div className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
        <div className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      </div>
      <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
    </div>
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
          <Route path="search" element={<PrivateRoute><ProfileCompletionRoute><FoodSearch /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="dashboard" element={<PrivateRoute><ProfileCompletionRoute><UserDashboard /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="cart" element={<PrivateRoute><ProfileCompletionRoute><Cart /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="checkout" element={<PrivateRoute><ProfileCompletionRoute><Checkout /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="orders" element={<PrivateRoute><ProfileCompletionRoute><Orders /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="orders/:id/tracking" element={<PrivateRoute><ProfileCompletionRoute><OrderTrackingPage role="user" /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="wishlist" element={<PrivateRoute><ProfileCompletionRoute><Wishlist /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="contact" element={<PrivateRoute><ProfileCompletionRoute><UserContact /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="budget-assistant" element={<PrivateRoute><ProfileCompletionRoute><BudgetAssistantPage /></ProfileCompletionRoute></PrivateRoute>} />
          <Route path="notifications" element={<PrivateRoute><ProfileCompletionRoute><Notifications /></ProfileCompletionRoute></PrivateRoute>} />
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
          <Route index element={<ProfileCompletionRoute role="deliveryBoy"><DeliveryDashboard /></ProfileCompletionRoute>} />
          <Route path="orders" element={<ProfileCompletionRoute role="deliveryBoy"><DeliveryOrders /></ProfileCompletionRoute>} />
          <Route path="earnings" element={<ProfileCompletionRoute role="deliveryBoy"><DeliveryEarnings /></ProfileCompletionRoute>} />
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
          <Route path="orders/:id/tracking" element={<OrderTrackingPage role="admin" />} />
          <Route path="users" element={<Navigate to="/admin/users/customers" replace />} />
          <Route path="users/customers" element={<CustomerUsers />} />
          <Route path="users/delivery-boys" element={<DeliveryBoyUsers />} />
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
