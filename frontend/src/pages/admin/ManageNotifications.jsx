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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
        <p className="text-slate-500 mt-1">Broadcast messages and offers to users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">Send Broadcast</h2>
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <input className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Notification Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[120px]" placeholder="Message Body" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}></textarea>
            <select className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="info">General Info</option>
              <option value="success">Success / Offer</option>
              <option value="warning">Alert / Warning</option>
            </select>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50">
              {loading ? "Sending..." : "Send to All Users"}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Recent Broadcasts</h2>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
            {notifications.map((n) => (
              <div key={n._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{n.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                    n.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    n.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{n.type}</span>
                </div>
                <p className="text-slate-600 text-sm">{n.message}</p>
                <span className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
