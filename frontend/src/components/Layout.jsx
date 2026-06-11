import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

const navItems = [
  {
    label: "Dashboard", path: "/dashboard",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>
  },
  {
    label: "Monitoring", path: "/monitoring",
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  },
  {
    label: "Control", path: "/Control",
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></>
  },
  {
    label: "Schedules", path: "/schedules",
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>
  },
  {
    label: "Tanks", path: "/tanks",
    icon: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>
  },
  {
    label: "Log", path: "/log",
    icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#27272A] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v5" />
            </svg>
          </div>
          <span className="font-semibold text-[#0F172A] dark:text-[#FAFAFA] text-sm">Irrigation</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                ? "bg-[#ECFDF5] dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                : "text-[#64748B] dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F172A] dark:hover:text-[#FAFAFA]"
                }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                {item.icon}
              </svg>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[#E2E8F0] dark:border-[#27272A] space-y-0.5 shrink-0">
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#64748B] dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            {dark
              ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
              : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            }
          </svg>
          {dark ? "Light Mode" : "Dark Mode"}
        </button>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#09090B] transition-colors duration-300">

      {/* ── Sidebar Desktop (md ke atas) ── */}
      <aside className="hidden md:flex w-56 lg:w-60 shrink-0 h-full flex-col bg-white dark:bg-[#18181B] border-r border-[#E2E8F0] dark:border-[#27272A] transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* ── Sidebar Mobile (overlay) ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-60 h-full flex flex-col bg-white dark:bg-[#18181B] border-r border-[#E2E8F0] dark:border-[#27272A]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#18181B] border-b border-[#E2E8F0] dark:border-[#27272A] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-[#64748B] dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-semibold text-sm text-[#0F172A] dark:text-[#FAFAFA]">Irrigation</span>
        </div>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {/* w-full: Lebar maksimal
            px-5 md:px-8: Menyamakan padding kiri-kanan dengan Sidebar
            pt-4 md:pt-6: Mengatur jarak dari atas
          */}
          <div className="w-full px-5 md:px-8 pt-4 md:pt-6 pb-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
