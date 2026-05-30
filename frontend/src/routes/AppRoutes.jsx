import { Routes, Route, Navigate } from "react-router-dom";

/* COMMON */
import CommonLayout from "../pages/common/CommonLayout";
import Home from "../pages/common/Home";
import About from "../pages/common/About";
import Contact from "../pages/common/Contact";

/* AUTH */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

/* USER */
import UserLayout from "../pages/user/UserLayout";
import UserDashboard from "../pages/user/UserDashboard";
import Menu from "../pages/user/Menu";
import Cart from "../pages/user/Cart";
import Checkout from "../pages/user/Checkout";
import Orders from "../pages/user/Orders";
import Profile from "../pages/user/Profile";
import UserContact from "../pages/user/Contact";

/* ADMIN */
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageFoods from "../pages/admin/ManageFoods";
import ManageOrders from "../pages/admin/ManageOrders";
import ManageUsers from "../pages/admin/ManageUsers";
import Contacts from "../pages/admin/Contacts";
import ManageSettings from "../pages/admin/ManageSettings";

/* ROUTE GUARDS */
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {

return (

<Routes>

{/* PUBLIC WEBSITE WITH NAVBAR + FOOTER */}

<Route element={<CommonLayout />}>

<Route path="/" element={<Home />} />

<Route path="/about" element={<About />} />

<Route path="/contact" element={<Contact />} />

<Route path="/login" element={<Login />} />

<Route path="/register" element={<Register />} />

</Route>


{/* USER PANEL */}

<Route
path="/user"
element={
<PrivateRoute>
<UserLayout />
</PrivateRoute>
}
>

<Route index element={<UserDashboard />} />

<Route path="menu" element={<Menu />} />

<Route path="cart" element={<Cart />} />

<Route path="checkout" element={<Checkout />} />

<Route path="orders" element={<Orders />} />

<Route path="profile" element={<Profile />} />

<Route path="contact" element={<UserContact />} />

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

</Route>


{/* FALLBACK */}

<Route path="*" element={<Navigate to="/" />} />

</Routes>

);

}