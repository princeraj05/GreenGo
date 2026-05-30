import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/api/users/login", {
        email,
        password,
      });

      const data = res.data;

      localStorage.setItem("token", data.token);

      if (data.role === "admin") navigate("/admin");
      else navigate("/user");

    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-10 overflow-hidden relative">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/30 mb-4 hover:scale-105 transition-transform">
            <span className="text-3xl text-white">🍔</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ByteBite</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Welcome back! Sign in to continue</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 px-8 py-10">
          <h2 className="text-xl font-black text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-5">

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-orange-500/30"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-orange-600 font-bold hover:underline">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}