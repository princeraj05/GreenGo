import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldBan, ShieldCheck } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) { console.log(err); }
  };

  const toggleBlock = async (id, currentBlocked) => {
    try {
      const token = await getToken();
      await API.put(`/api/admin/users/${id}/status`, { status: currentBlocked ? "Active" : "Blocked" }, { headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch (err) { console.log(err); }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shadow-sm">
            <Users size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Manage Users</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-lg">View and manage all registered users</p>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-3.5"
          />
        </div>
      </motion.div>

      {/* Table Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-slate-100 dark:border-slate-800/60 overflow-hidden p-0 bg-white dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Details</th>
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spent</th>
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Orders</th>
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                {filteredUsers.map(u => {
                  const isBlocked = u.blocked || u.status === "Blocked";
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-450 flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-base">{u.name}</div>
                            <div className="text-slate-500 dark:text-slate-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-black text-slate-900 dark:text-white text-base">₹{u.totalSpent || 0}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">{u.totalOrders || 0}</span>
                      </td>
                      <td className="px-8 py-5">
                        <Badge variant={!isBlocked ? "success" : "danger"} className="uppercase tracking-wider">
                          {!isBlocked ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button
                          size="sm"
                          variant={!isBlocked ? "outline" : "default"}
                          onClick={() => toggleBlock(u._id, isBlocked)}
                          className={`gap-2 rounded-xl transition-all ${!isBlocked ? 'text-red-500 border-red-200 dark:border-red-950/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                        >
                          {!isBlocked ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                          {!isBlocked ? "Block User" : "Unblock User"}
                        </Button>
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
      </motion.div>

    </div>
  );
}