import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { Edit3, Trash2, Megaphone, Calendar, X, AlertTriangle, Bell, CheckCircle } from "lucide-react";

export default function ManageNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", type: "info", expiresAt: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (n) => {
    setEditingId(n._id);
    setForm({
      title: n.title,
      message: n.message,
      type: n.type,
      expiresAt: n.expiresAt ? new Date(n.expiresAt).toISOString().slice(0, 16) : ""
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", message: "", type: "info", expiresAt: "" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const url = editingId 
        ? `${import.meta.env.VITE_API_URL}/api/notifications/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/notifications`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          type: form.type,
          expiresAt: form.expiresAt || null
        })
      });

      if (res.ok) {
        setForm({ title: "", message: "", type: "info", expiresAt: "" });
        setEditingId(null);
        loadNotifications();
        alert(editingId ? "Broadcast updated successfully!" : "Broadcast sent successfully!");
      } else {
        alert("Action failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadNotifications();
        alert("Broadcast deleted successfully.");
      } else {
        alert("Failed to delete broadcast.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting broadcast.");
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Megaphone size={26} />
          </div>
          Notification Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Broadcast messages and promotional offers to users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8">
        {/* Form panel */}
        <div>
          <Card className="p-6 md:p-8 border-slate-100 dark:border-slate-800/60 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              {editingId ? "Edit Broadcast Message" : "Send Global Broadcast"}
            </h2>
            
            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-2">Title *</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-450 dark:placeholder:text-slate-500 font-medium text-sm"
                  placeholder="Notification Title" 
                  required 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message Body *</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none min-h-[120px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-955 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-455 dark:placeholder:text-slate-500 font-medium text-sm resize-none"
                  placeholder="Type your announcement or deal details..." 
                  required 
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Broadcast Category</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm cursor-pointer"
                  value={form.type} 
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="info" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">General Announcement</option>
                  <option value="success" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Success / Promotion & Offer</option>
                  <option value="warning" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alert / Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar size={15} />
                  Expiry Date & Time (Optional)
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                  value={form.expiresAt} 
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} 
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold block mt-1.5 leading-normal">
                  If set, the broadcast will automatically disappear from both user accounts and the admin panel once the expiration time passes.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                {editingId && (
                  <Button type="button" variant="secondary" onClick={handleCancelEdit} className="flex-1 py-3.5 rounded-xl font-bold">
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 font-bold">
                  {loading ? "Processing..." : editingId ? "Update Broadcast" : "Send to All Users"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* List panel */}
        <div>
          <Card className="p-6 md:p-8 border-slate-100 dark:border-slate-800/60 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              Recent Broadcasts
            </h2>
            
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 gap-2">
                  <span>📢</span>
                  <p className="font-bold">No active broadcast messages found.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900 flex flex-col gap-3 group relative overflow-hidden transition-all hover:shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">{n.title}</h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-550 block mt-1 leading-none">
                          Sent: {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider shrink-0 ${
                        n.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                        n.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                        'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                      }`}>{n.type}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">{n.message}</p>

                    {n.expiresAt && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/20 px-2.5 py-1 rounded-lg w-fit">
                        <Calendar size={12} />
                        <span>Expires: {new Date(n.expiresAt).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-150 dark:border-slate-800/40">
                      <button 
                        onClick={() => handleStartEdit(n)} 
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                        title="Edit Broadcast"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(n._id)} 
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                        title="Delete Broadcast"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
