import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Gift, MessageCircle, PackageCheck, RefreshCw } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getToken } from "../../utils/getToken";
import { getApiUrl } from "../../utils/getApiUrl";

/* --- HELPER FUNCTIONS --- */

const getTypeIcon = (notification) => {
  const title = (notification.title || "").toLowerCase();
  const msg = (notification.message || "").toLowerCase();
  const fullText = `${title} ${msg}`;

  if (fullText.includes("placed")) {
    return <span className="text-base select-none leading-none">🟢</span>;
  }
  if (fullText.includes("cancellation requested") || fullText.includes("cancellation request received")) {
    return <span className="text-base select-none leading-none">🟠</span>;
  }
  if (fullText.includes("order cancelled") || fullText.includes("cancelled")) {
    return <span className="text-base select-none leading-none">🔴</span>;
  }
  if (fullText.includes("out for delivery") || fullText.includes("dispatched")) {
    return <span className="text-base select-none leading-none">🚚</span>;
  }

  if (fullText.includes("coupon") || fullText.includes("promo")) return <Gift size={16} />;
  if (fullText.includes("support") || fullText.includes("reply")) return <MessageCircle size={16} />;
  if (fullText.includes("order")) return <PackageCheck size={16} />;
  return <Bell size={16} />;
};

const cleanMessage = (msg) => {
  if (!msg) return "";
  let cleaned = msg.replace(/your\s+order\s+#\w+/gi, "your order");
  cleaned = cleaned.replace(/order\s+#\w+/gi, "Order");
  cleaned = cleaned.replace(/#\w{6,}/gi, "");
  return cleaned.replace(/\s+/g, " ").trim();
};

const getAccentClass = (notification) => {
  const title = (notification.title || "").toLowerCase();
  const msg = (notification.message || "").toLowerCase();
  const fullText = `${title} ${msg}`;

  if (fullText.includes("placed")) {
    return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40";
  }
  if (fullText.includes("cancellation requested") || fullText.includes("cancellation request received")) {
    return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/40";
  }
  if (fullText.includes("order cancelled") || fullText.includes("cancelled")) {
    return "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/25 dark:text-rose-300 dark:border-rose-900/40";
  }
  if (fullText.includes("out for delivery") || fullText.includes("dispatched")) {
    return "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/25 dark:text-sky-300 dark:border-sky-900/40";
  }

  const type = notification.type;
  if (type === "success") return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-900/40";
  if (type === "warning") return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/25 dark:text-amber-300 dark:border-amber-900/40";
  return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/25 dark:text-blue-300 dark:border-blue-900/40";
};

/**
 * Notifications Component
 */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setNotifications([]);
        return;
      }
      const res = await fetch(`${getApiUrl()}/api/notifications/my`, {
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
      const res = await fetch(`${getApiUrl()}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Remove from list since they should disappear when read
        setNotifications((items) => items.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const smoothTransition = { type: "spring", stiffness: 300, damping: 28 };

  return (
    <div className="pb-10 max-w-5xl mx-auto px-3 sm:px-4">
      {/* --- HEADER BAR --- */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smoothTransition}
        className="flex items-center justify-between gap-3 mb-5"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-300 flex items-center justify-center border border-brand-100 dark:border-brand-900/40 shrink-0">
              <Bell size={16} />
            </span>
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mt-0.5 font-medium">
            Order updates, support replies, coupons and broadcasts.
          </p>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button type="button" variant="secondary" onClick={loadNotifications} className="rounded-xl py-1.5 px-3 text-xs gap-1">
            <RefreshCw size={12} /> Refresh
          </Button>
          {notifications.length > 0 && (
            <Button type="button" onClick={markAllAsRead} className="rounded-xl py-1.5 px-3 text-xs gap-1">
              <CheckCheck size={12} /> Mark Read
            </Button>
          )}
        </div>
      </motion.div>

      {/* --- NOTIFICATIONS CARD STREAM --- */}
      <Card className="p-3 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 rounded-2xl">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell size={22} />
            </div>
            <p className="text-slate-900 dark:text-white font-bold text-sm">No notifications yet</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Updates will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {notifications.map((notification) => {
                const isRead = notification.isRead || notification.read;
                return (
                  <motion.button
                    key={notification._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={smoothTransition}
                    type="button"
                    onClick={() => !isRead && markAsRead(notification._id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      isRead
                        ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40"
                        : "bg-brand-50/20 dark:bg-brand-950/10 border-brand-100 dark:border-brand-900/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${getAccentClass(notification)}`}>
                        {getTypeIcon(notification)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                            {notification.title || "Notification"}
                          </span>
                          {!isRead && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-brand-500" />}
                        </span>
                        <span className="block text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                          {cleanMessage(notification.message)}
                        </span>
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-2.5">
                          {new Date(notification.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
}

