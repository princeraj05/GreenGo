import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Users, Search, ShieldBan, ShieldCheck, Bike, MapPin, Phone } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

/**
 * ManageUsers Component
 * Moderation and membership controls interface. Facilitates filtering registered 
 * accounts by roles (customers vs delivery boys), blocking/unblocking accounts, 
 * promoting accounts, and searching members by profile data fields.
 */
export default function ManageUsers({
  roleFilter = "all",
  title = "Manage Users",
  subtitle = "View and manage all registered users"
}) {
  // Pagination page size limit configuration
  const PAGE_SIZE = 30;

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  // Array of user accounts retrieved from DB
  const [users, setUsers] = useState([]);

  // Search filter query string input state
  const [searchQuery, setSearchQuery] = useState("");

  // Visible users count for pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Fetches user accounts data.
   */
  const loadUsers = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) { console.log(err); }
  }, []);

  // Fetch users on component mount
  useEffect(() => { Promise.resolve().then(loadUsers); }, [loadUsers]);

  /**
   * Toggles the block/unblock status of a user.
   */
  const toggleBlock = async (id, currentBlocked) => {
    try {
      const token = await getToken();
      await API.put(`/api/admin/users/${id}/status`, { status: currentBlocked ? "Active" : "Blocked" }, { headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch (err) { console.log(err); }
  };

  /**
   * Modifies authorization role variables on the target user.
   */
  const setUserRole = async (id, role) => {
    try {
      const token = await getToken();
      await API.put(`/api/admin/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch (err) { console.log(err); }
  };

  // Memoized search-and-filter logic to compute user lists without unnecessary re-renders
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const roleFiltered = users.filter((user) => {
      const role = user.role === "user" || !user.role ? "customer" : user.role;
      if (roleFilter === "customers") return role === "customer";
      if (roleFilter === "deliveryBoys") return role === "deliveryBoy";
      return true;
    });
    if (!query) return roleFiltered;
    return roleFiltered.filter(u =>
      (u.name || "").toLowerCase().includes(query) ||
      (u.email || u.phone || "").toLowerCase().includes(query)
    );
  }, [roleFilter, searchQuery, users]);

  // Count total customers and delivery boys from all fetched users
  const customerCount = useMemo(() => {
    return users.filter((user) => {
      const role = user.role === "user" || !user.role ? "customer" : user.role;
      return role === "customer";
    }).length;
  }, [users]);

  const deliveryBoyCount = useMemo(() => {
    return users.filter((user) => {
      const role = user.role === "user" || !user.role ? "customer" : user.role;
      return role === "deliveryBoy";
    }).length;
  }, [users]);

  // Slices filtered list to match pagination visibleCount limit
  const visibleUsers = useMemo(() => filteredUsers.slice(0, visibleCount), [filteredUsers, visibleCount]);

  // Denotes if more unrendered user rows exist
  const hasMoreUsers = visibleUsers.length < filteredUsers.length;

  return (
    // Outer layout container
    <div className="w-full pb-10">

      {/* --- HEADER & SEARCH BAR SECTION --- */}
      {/* Responsive layout containers: layouts adjust from flex-col to sm:flex-row */}
      <div className="mb-6 md:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shadow-sm shrink-0">
            <Users size={22} className="text-blue-600 dark:text-blue-400 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm sm:text-base md:text-lg leading-snug">{subtitle}</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400 dark:text-slate-500" />
          </div>
          <Input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="pl-11 sm:pl-12 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-3 sm:py-3.5 text-sm sm:text-base"
          />
        </div>
      </div>
      {/* --- END HEADER & SEARCH BAR SECTION --- */}

      {/* --- STATS SUMMARY CARDS --- */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">{customerCount}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Bike size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Total Delivery Boys</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">{deliveryBoyCount}</p>
          </div>
        </div>
      </div>

      {/* --- SUB-NAVIGATION BUTTONS --- */}
      <div className="mb-5 flex flex-wrap gap-2">
        <NavLink
          to="/admin/users/customers"
          className={({ isActive }) => `rounded-2xl border px-4 py-2 text-sm font-black transition-all flex items-center gap-2 ${
            isActive
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          {({ isActive }) => (
            <>
              <span>Customers</span>
              <span className={`px-2 py-0.5 text-xs font-black rounded-full transition-all ${
                isActive
                  ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {customerCount}
              </span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/admin/users/delivery-boys"
          className={({ isActive }) => `rounded-2xl border px-4 py-2 text-sm font-black transition-all flex items-center gap-2 ${
            isActive
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          {({ isActive }) => (
            <>
              <span>Delivery Boys</span>
              <span className={`px-2 py-0.5 text-xs font-black rounded-full transition-all ${
                isActive
                  ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {deliveryBoyCount}
              </span>
            </>
          )}
        </NavLink>
      </div>
      {/* --- END SUB-NAVIGATION BUTTONS --- */}

      {/* --- USERS MODERATION DATA SECTION --- */}
      <div>
        
        {/* --- MOBILE ONLY CARDS VIEW LIST --- */}
        {/* Class 'md:hidden' hides this panel container on viewports wider than mobile screens */}
        <div className="grid gap-3 md:hidden">
          {visibleUsers.map((u) => {
            const isBlocked = u.blocked || u.status === "Blocked";
            const deliveryDetails = u.deliveryDetails || {};
            const deliveryComplete = Boolean(deliveryDetails.profileCompleted);
            return (
              <Card key={u._id} className="p-4 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black shrink-0">
                    {(u.name || u.email || u.phone || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-950 dark:text-white truncate">{u.name || "GreenGo User"}</h3>
                    {u.email && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 break-all">{u.email}</p>}
                    {u.role !== "deliveryBoy" && u.phone && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Phone size={13} className="text-brand-500 shrink-0" /> {u.phone}
                      </p>
                    )}
                    {!u.email && !u.phone && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No contact</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={u.role === "admin" ? "danger" : u.role === "deliveryBoy" ? "blue" : "gray"} className="uppercase">
                        {u.role === "user" ? "customer" : u.role || "customer"}
                      </Badge>
                      <Badge variant={!isBlocked ? "success" : "danger"} className="uppercase">
                        {!isBlocked ? "Active" : "Blocked"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {u.role === "deliveryBoy" ? (
                    <>
                      <InfoPill label="Total Earnings" value={`₹${u.totalEarnings || 0}`} />
                      <InfoPill label="Delivered Orders" value={u.deliveredOrdersCount || 0} />
                    </>
                  ) : (
                    <>
                      <InfoPill label="Spent" value={`₹${u.totalSpent || 0}`} />
                      <InfoPill label="Orders" value={u.totalOrders || 0} />
                    </>
                  )}
                </div>

                {u.role === "deliveryBoy" && (
                  <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
                    <Badge variant={deliveryComplete ? "success" : "warning"} className="uppercase">
                      {deliveryComplete ? "Profile Complete" : "Profile Pending"}
                    </Badge>
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Phone size={13} className="text-brand-500" /> {u.phone || "Phone missing"}
                    </p>
                    <p className="mt-1 flex items-start gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <MapPin size={13} className="text-brand-500 mt-0.5 shrink-0" />
                      <span>{deliveryDetails.address || u.address || "Address missing"}</span>
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {u.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setUserRole(u._id, u.role === "deliveryBoy" ? "customer" : "deliveryBoy")}
                      className="min-h-11 gap-2 rounded-xl"
                    >
                      <Bike size={16} />
                      {u.role === "deliveryBoy" ? "Remove Delivery Boy" : "Make Delivery Boy"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={!isBlocked ? "secondary" : "primary"}
                    onClick={() => toggleBlock(u._id, isBlocked)}
                    className={`min-h-11 gap-2 rounded-xl ${!isBlocked ? "text-red-500 border-red-200 dark:border-red-950/50" : "bg-emerald-500 hover:bg-emerald-600"}`}
                  >
                    {!isBlocked ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                    {!isBlocked ? "Block" : "Unblock"}
                  </Button>
                </div>
              </Card>
            );
          })}
          {filteredUsers.length === 0 && (
            <Card className="p-8 text-center">
              <Search size={30} className="mx-auto text-slate-300" />
              <h3 className="mt-3 font-black text-slate-950 dark:text-white">No users found</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Try a different search query.</p>
            </Card>
          )}
        </div>
        {/* --- END MOBILE CARDS VIEW LIST --- */}

        {/* --- DESKTOP GRID TABLE VIEW --- */}
        {/* Class 'hidden md:block' ensures table displays exclusively on desktop dimensions */}
        <Card className="border-slate-100 dark:border-slate-800/60 overflow-hidden p-0 bg-white dark:bg-slate-950">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[720px] md:min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="text-left px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Details</th>
                  <th className="text-left px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {roleFilter === "deliveryBoys" ? "Total Earnings" : "Total Spent"}
                  </th>
                  <th className="text-left px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {roleFilter === "deliveryBoys" ? "Delivered Orders" : "Total Orders"}
                  </th>
                  <th className="text-left px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                {visibleUsers.map(u => {
                  const isBlocked = u.blocked || u.status === "Blocked";
                  const deliveryDetails = u.deliveryDetails || {};
                  const deliveryComplete = Boolean(deliveryDetails.profileCompleted);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-450 flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                            {(u.name || u.email || u.phone || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-950 dark:text-white text-sm md:text-base truncate max-w-[210px]">{u.name || "GreenGo User"}</div>
                            {u.email && <div className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[230px]">{u.email}</div>}
                            {u.role !== "deliveryBoy" && u.phone && (
                              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-1 flex items-center gap-1.5">
                                <Phone size={12} className="text-brand-500" />
                                {u.phone}
                              </div>
                            )}
                            {!u.email && !u.phone && <div className="text-slate-500 dark:text-slate-400 font-medium">No contact</div>}
                            {u.role === "deliveryBoy" && (
                              <div className="mt-2 space-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <p className="flex items-center gap-1.5">
                                  <Phone size={12} className="text-brand-500" />
                                  {u.phone || "Phone missing"}
                                </p>
                                <p className="flex items-start gap-1.5 max-w-[300px]">
                                  <MapPin size={12} className="text-brand-500 mt-0.5 shrink-0" />
                                  <span className="line-clamp-2">{deliveryDetails.address || u.address || "Address missing"}</span>
                                </p>
                                {deliveryDetails.updatedAt && (
                                  <p>Updated: {new Date(deliveryDetails.updatedAt).toLocaleString()}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        {u.role === "deliveryBoy" ? (
                          <span className="font-black text-slate-950 dark:text-white text-base">₹{u.totalEarnings || 0}</span>
                        ) : (
                          <span className="font-black text-slate-950 dark:text-white text-base">₹{u.totalSpent || 0}</span>
                        )}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        {u.role === "deliveryBoy" ? (
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">{u.deliveredOrdersCount || 0}</span>
                        ) : (
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">{u.totalOrders || 0}</span>
                        )}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <Badge variant={u.role === "admin" ? "danger" : u.role === "deliveryBoy" ? "blue" : "gray"} className="uppercase tracking-wider">
                          {u.role === "user" ? "customer" : u.role || "customer"}
                        </Badge>
                        {u.role === "deliveryBoy" && (
                          <div className="mt-2">
                            <Badge variant={deliveryComplete ? "success" : "warning"} className="uppercase tracking-wider">
                              {deliveryComplete ? "Profile Complete" : "Profile Pending"}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <Badge variant={!isBlocked ? "success" : "danger"} className="uppercase tracking-wider">
                          {!isBlocked ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setUserRole(u._id, u.role === "deliveryBoy" ? "customer" : "deliveryBoy")}
                              className="gap-2 rounded-xl"
                            >
                              <Bike size={16} />
                              {u.role === "deliveryBoy" ? "Remove Delivery Boy" : "Make Delivery Boy"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={!isBlocked ? "secondary" : "primary"}
                            onClick={() => toggleBlock(u._id, isBlocked)}
                            className={`gap-2 rounded-xl transition-all ${!isBlocked ? 'text-red-500 border-red-200 dark:border-red-950/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                          >
                            {!isBlocked ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                            {!isBlocked ? "Block" : "Unblock"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found.</h3>
                <p className="text-sm font-medium mt-1">Try a different search query.</p>
              </div>
            )}
          </div>
        </Card>
        {/* --- END DESKTOP GRID TABLE VIEW --- */}

        {/* Dynamic Pagination Loading control */}
        {hasMoreUsers && (
          <div className="mt-5 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="rounded-2xl px-6"
            >
              Show More Users ({filteredUsers.length - visibleUsers.length})
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// TABLE PILL HELPER COMPONENT
// ==========================================

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
