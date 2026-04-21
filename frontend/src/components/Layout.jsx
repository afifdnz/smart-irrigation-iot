import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/plots', label: 'Plot' },
  { path: '/tanks', label: 'Tandon Air' },
  { path: '/schedules', label: 'Jadwal' },
  { path: '/settings', label: 'Konfigurasi' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white flex flex-col">
        <div className="p-6 border-b border-green-700">
          <h1 className="text-lg font-bold">Irigasi IoT</h1>
          <p className="text-green-300 text-sm">Monitoring & Kontrol</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg text-sm transition ${location.pathname.startsWith(item.path) ? 'bg-green-600 text-white' : 'text-green-100 hover:bg-green-700'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700">
          <button onClick={handleLogout} className="w-full px-4 py-2 text-sm text-green-100 hover:bg-green-700 rounded-lg text-left"> Logout </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>

  );
}
