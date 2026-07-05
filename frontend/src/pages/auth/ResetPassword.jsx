import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await API.post(`/api/users/reset-password/${token}`, { password });
      setMessage(res.data.message || "Password updated successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset token is invalid or expired. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-transparent px-4 py-10 overflow-hidden relative">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4 hover:scale-105 transition-transform overflow-hidden border border-brand-100 dark:border-brand-900">
            <img src="/logo/final-logo.png" alt="GreenGo" className="w-full h-full object-cover" />
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">GreenGo</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-2">Set your new password</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 dark:border-slate-800 px-8 py-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Reset Password</h2>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              {message} (Redirecting to login...)
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-orange-500/30"
            >
              {loading ? "Resetting..." : "Save Password →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

