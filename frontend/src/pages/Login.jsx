import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await login(username, password);
      if (res?.data?.token) {
        setToken(res.data.token);
        navigate("/dashboard");
      } else {
        setError("Token tidak ditemukan di response");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 px-4 relative overflow-hidden">

      {/* --- Background Decorative Blobs --- */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/10 dark:bg-sky-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm z-10">

        {/* Header Section */}
        <div className="text-center mb-10"> {/* Menambah margin bawah header agar tidak mepet ke box */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/20 mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Smart Irrigation
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
            Masuk ke panel monitoring & kontrol
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Username Input Group */}
            <div className="flex flex-col gap-2.5"> {/* Menggunakan flex-col & gap-2.5 untuk jarak label-input yang pasti */}
              <label className="text-sm font-semibold text-slate-800 dark:text-zinc-100 px-0.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            {/* Password Input Group */}
            <div className="flex flex-col gap-2.5"> {/* Jarak antar label-input 10px agar lebih lega */}
              <label className="text-sm font-semibold text-slate-800 dark:text-zinc-100 px-0.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-bold transition-all duration-200 shadow-md shadow-emerald-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>

          </form>
        </div>

        {/* Footer Copyright */}
        <div className="mt-6 text-center"> {/* Menambah margin atas (64px) untuk memisahkan konten dari footer */}
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
            Smart Irrigation IoT © {new Date().getFullYear()}
          </p>
          <div className="mt-1.5 w-10 h-0.5 bg-emerald-500/20 mx-auto rounded-full" /> {/* Dekorasi kecil di bawah copyright */}
        </div>

      </div>
    </div>
  );
}
