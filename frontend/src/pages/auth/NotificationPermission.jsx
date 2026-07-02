import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Percent, Sparkles, Utensils, CupSoda, ShoppingBag } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export default function NotificationPermission() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.redirect || "/user/menu";

  const handleEnableNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Request native push notification permission if on mobile
        if (window.PushNotifications) {
          const permission = await window.PushNotifications.requestPermissions();
          console.log("[NOTIFICATIONS] Native permission request result:", permission);
        } else if (Notification) {
          await Notification.requestPermission();
        }
      } else if (typeof Notification !== "undefined") {
        // Browser notification permission request
        const status = await Notification.requestPermission();
        console.log("[NOTIFICATIONS] Web permission status:", status);
      }
    } catch (err) {
      console.warn("Failed to request notification permission:", err);
    } finally {
      // Proceed to the home/menu page
      navigate(redirectPath, { replace: true });
    }
  };

  const handleSkip = () => {
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-white dark:bg-slate-950 px-6 py-10 font-sans">
      {/* Top spacing */}
      <div />

      {/* Main Illustrative Content */}
      <div className="flex flex-col items-center max-w-md w-full text-center my-auto">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-snug mb-10 px-4">
          Enable notifications to get updates about offers, order status and more
        </h1>

        {/* Animated Zomato-style Notification Illustration */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
          {/* Central glowing background circle */}
          <div className="absolute w-44 h-44 rounded-full bg-brand-50 dark:bg-brand-950/20 blur-md" />
          <div className="absolute w-36 h-36 rounded-full bg-brand-100/60 dark:bg-brand-900/10 border border-brand-100/50 dark:border-brand-900/30" />

          {/* Central Bell */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
              repeatDelay: 1,
            }}
            className="z-10 p-6 bg-brand-500 text-white rounded-full shadow-lg shadow-brand-500/30"
          >
            <Bell className="w-16 h-16 stroke-[1.5]" />
          </motion.div>

          {/* Floating icons surrounding the bell */}
          
          {/* Offers % Icon */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute top-8 left-8 p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-md shadow-emerald-500/5"
          >
            <Percent className="w-7 h-7 stroke-[2]" />
          </motion.div>

          {/* Chef Hat / Food Utensils Icon */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-12 right-6 p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-md shadow-amber-500/5"
          >
            <Utensils className="w-7 h-7 stroke-[2]" />
          </motion.div>

          {/* Drink Cup Icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.2 }}
            className="absolute bottom-10 left-6 p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-md shadow-blue-500/5"
          >
            <CupSoda className="w-7 h-7 stroke-[2]" />
          </motion.div>

          {/* Delivery Bag Icon */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.7 }}
            className="absolute bottom-8 right-8 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-md shadow-rose-500/5"
          >
            <ShoppingBag className="w-7 h-7 stroke-[2]" />
          </motion.div>

          {/* Little sparkles around */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute top-4 right-28 text-brand-400"
          >
            <Sparkles className="w-5 h-5 fill-brand-400" />
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md flex flex-col gap-3 px-4">
        <button
          onClick={handleEnableNotifications}
          className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/20 active:scale-[0.99] transition-all"
        >
          Enable Notifications
        </button>

        <button
          onClick={handleSkip}
          className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-extrabold text-sm sm:text-base active:scale-[0.99] transition-all"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
