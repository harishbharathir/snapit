import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Wallet } from 'lucide-react';

const Navbar = ({ currentUser, onLogout }) => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-orange-500 flex items-center gap-2">
          <img src="/snapit_logo.png" alt="snapit logo" className="h-25 w-auto inline-block" />
        </Link>
        <div className="flex items-center gap-6">
          {currentUser?.role === 'student' && (
            <div className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <Wallet size={16} /> ₹{currentUser.wallet_balance}
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 hidden sm:inline-block">
              Hi, {currentUser?.username}
            </span>
            <button 
              onClick={onLogout}
              className="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
              title="Logout"
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
