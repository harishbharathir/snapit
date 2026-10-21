import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  Store, 
  ChefHat, 
  BarChart3, 
  ShieldCheck, 
  UserCheck,
  Factory
} from 'lucide-react';

const PartnerNavbar = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const role = currentUser?.role || 'staff';

  const navItems = [
    ...(role === 'staff' || role === 'admin' ? [{
      path: '/counter',
      label: 'Staff Counter',
      icon: Store
    }] : []),
    ...(role === 'kitchen' || role === 'staff' || role === 'admin' ? [{
      path: '/kitchen',
      label: 'Kitchen Distributor',
      icon: Factory
    }] : []),
    ...(role === 'admin' ? [{
      path: '/admin',
      label: 'Admin Analytics',
      icon: BarChart3
    }] : [])
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center p-1.5">
              <img src="/snapit_logo.png" alt="snapit logo" className="h-full w-auto object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white leading-none block">snapit</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">PARTNER</span>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/counter' && location.pathname === '/' && role === 'staff') || (item.path === '/kitchen' && location.pathname === '/' && role === 'kitchen') || (item.path === '/admin' && location.pathname === '/' && role === 'admin');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${
              role === 'admin' ? 'bg-purple-400' : role === 'kitchen' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className="capitalize">{currentUser?.username} ({role})</span>
          </div>

          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
            title="Log out of partner portal"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PartnerNavbar;
