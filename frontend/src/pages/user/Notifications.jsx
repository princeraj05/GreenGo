import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Gift, MessageCircle, PackageCheck, RefreshCw } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getToken } from "../../utils/getToken";

const getTypeIcon = (notification) => {
  const title = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  if (title.includes("coupon") || title.includes("promo")) return <Gift size={20} />;
  if (title.includes("support") || title.includes("reply")) return <MessageCircle size={20} />;
  if (title.includes("order")) return <PackageCheck size={20} />;
  return <Bell size={20} />;
};

const getAccentClass = (type) => {
  if (type === "success") return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40";
  if (type === "warning") return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/40";
  return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/25 dark:text-blue-300 dark:border-blue-900/40";
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !(item.isRead || item.read)).length,
    [notifications]
  );

  const markAsRead = async (id) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((items) => items.map((item) => item._id === id ? { ...item, read: true, isRead: true } : item));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !(item.isRead || item.read));
    await Promise.all(unread.map((item) => markAsRead(item._id)));
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-300 flex items-center justify-center border border-brand-100 dark:border-brand-900/40">
              <Bell size={23} />
            </span>
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Order updates, support replies, coupons and admin broadcasts.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={loadNotifications} className="rounded-xl gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button type="button" onClick={markAllAsRead} className="rounded-xl gap-2">
              <CheckCheck size={16} /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 md:p-6 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Bell size={28} />
            </div>
            <p className="text-slate-900 dark:text-white font-extrabold text-lg">No notifications yet</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Updates will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isRead = notification.isRead || notification.read;
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => !isRead && markAsRead(notification._id)}
                  className={`w-full text-left rounded-2xl border p-4 md:p-5 transition-all ${
                    isRead
                      ? "bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/60"
                      : "bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/60 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center ${getAccentClass(notification.type)}`}>
                      {getTypeIcon(notification)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-black text-slate-900 dark:text-white text-base md:text-lg leading-tight">
                          {notification.title || "Notification"}
                        </span>
                        {!isRead && <span className="shrink-0 mt-1 w-2.5 h-2.5 rounded-full bg-brand-500" />}
                      </span>
                      <span className="block text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1">
                        {notification.message}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-3">
                        {new Date(notification.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
