import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function ManageNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
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

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      setForm({ title: "", message: "", type: "info" });
      loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Notification Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Broadcast messages and offers to users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Send Broadcast</h2>
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <input className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder="Notification Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none min-h-[120px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 placeholder:text-slate-400 dark:placeholder:text-slate-500" placeholder="Message Body" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}></textarea>
            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="info" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">General Info</option>
              <option value="success" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Success / Offer</option>
              <option value="warning" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alert / Warning</option>
            </select>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50">
              {loading ? "Sending..." : "Send to All Users"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Recent Broadcasts</h2>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
            {notifications.map((n) => (
              <div key={n._id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white">{n.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    n.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                    n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                    'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  }`}>{n.type}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">{n.message}</p>
                <span className="text-xs text-slate-400 dark:text-slate-550 mt-2">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
