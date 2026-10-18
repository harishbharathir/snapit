import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Wallet, Receipt, ArrowLeft, Home } from 'lucide-react';

const Navbar = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Go Back Button (when away from home) + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isHomePage && (
            <button
              id="nav-go-back-btn"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-orange-600 bg-gray-100 hover:bg-orange-50 active:scale-95 rounded-xl border border-gray-200 hover:border-orange-200 transition shadow-sm cursor-pointer group"
              title="Go back to Home"
              aria-label="Go back to Home"
            >
              <ArrowLeft size={16} className="text-gray-500 group-hover:text-orange-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Go Back</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}

          <Link to="/" className="text-xl font-bold text-orange-500 flex items-center gap-2 shrink-0" title="SnapIt Home">
            <img src="/snapit_logo.png" alt="snapit logo" className="h-10 max-h-12 w-auto inline-block object-contain" />
          </Link>
        </div>

        {/* Right Side: Role Navigation Links, Wallet, User Info, Logout */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {currentUser?.role === 'student' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-green-700 bg-green-50 px-2.5 sm:px-3 py-1.5 rounded-full border border-green-200 shrink-0">
                <Wallet size={15} /> ₹{currentUser.wallet_balance}
              </div>

              {/* Home Navigation Button */}
              <Link
                to="/"
                id="nav-home-btn"
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border transition ${
                  isHomePage
                    ? 'text-white bg-orange-500 border-orange-500 shadow-sm'
                    : 'text-gray-600 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border-gray-200'
                }`}
                title="Go to Home"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Home</span>
              </Link>

              {/* My Bills Navigation Button */}
              <Link
                to="/bills"
                id="nav-bills"
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border transition ${
                  location.pathname === '/bills'
                    ? 'text-white bg-orange-500 border-orange-500 shadow-sm'
                    : 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200'
                }`}
                title="My Bills"
              >
                <Receipt size={15} />
                <span className="hidden sm:inline">My Bills</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Home Button for Staff & Admin */}
              <Link
                to="/"
                id="nav-dashboard-home-btn"
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border transition ${
                  isHomePage
                    ? 'text-white bg-orange-500 border-orange-500 shadow-sm'
                    : 'text-gray-600 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border-gray-200'
                }`}
                title="Dashboard Home"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sm font-medium text-gray-600 hidden md:inline-block">
              Hi, {currentUser?.username}
            </span>
            <button 
              onClick={onLogout}
              className="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50 cursor-pointer"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
