import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield size={24} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
              <p className="text-xs font-bold text-slate-400 mt-1">Effective Date: June 28, 2026</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-black transition-all max-w-max"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Welcome to GreenGo India. We are committed to protecting your privacy and security. This Privacy Policy outlines how we collect, use, process, and safeguard your personal details while using our mobile and web applications.
          </p>

          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">1. Data We Collect</h2>
            <p>To provide a seamless online food delivery service, we collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-900 dark:text-white font-black">Personal Info:</strong> Name, Email Address, Phone Number, and Date of Birth.</li>
              <li><strong className="text-slate-900 dark:text-white font-black">Location Details:</strong> Approximate and precise location coordinates to route delivery riders to your correct address.</li>
              <li><strong className="text-slate-900 dark:text-white font-black">Financial Details:</strong> Purchase and order history logs. Card transactions are processed directly by certified secure partners (Razorpay).</li>
              <li><strong className="text-slate-900 dark:text-white font-black">Device Identifiers:</strong> Unique push notification tokens and device telemetry.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">2. Data Usage & Security</h2>
            <p>
              We process user data to provide app services, verification processes, and location-based food distribution. All user data is encrypted in transit using standard HTTPS network interfaces.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 space-y-3">
            <h2 className="text-base font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <span>3. User Rights & Data Deletion</span>
            </h2>
            <p className="text-emerald-950/80 dark:text-emerald-200/80">
              Users maintain full control over their credentials. You can request account and profile deletion through the application:
            </p>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs font-bold space-y-1">
              <p>1. Open App Settings -> Go to <strong className="text-slate-900 dark:text-white">Privacy & Security Center</strong>.</p>
              <p>2. Tap on <strong className="text-red-500 font-black">"Request Account Deletion"</strong>.</p>
              <p>3. Following a 7-day safety backup period, your entire profile, location logs, and sessions will be permanently purged.</p>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Additionally, you may request manual deletion by writing to us at <strong className="font-black">princerajmne@gmail.com</strong>.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">4. Data Portability</h2>
            <p>
              You can export and download your stored personal info in raw JSON format anytime from the "Download My Data" interface within the user dashboard settings.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-bold">
              GreenGo India &copy; 2026. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
