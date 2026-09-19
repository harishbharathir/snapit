import React, { useState } from 'react';
import { api } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Store, 
  ShieldCheck, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle2,
  Zap
} from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regCanteenId, setRegCanteenId] = useState('A');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      setError('Please enter your username/email and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const user = await api.login({
        username: loginUsername.trim(),
        password: loginPassword
      });
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regUsername.trim()) {
      setError('Username is required');
      return;
    }
    if (regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const user = await api.register({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
        role: regRole,
        canteen_id: regRole === 'staff' ? regCanteenId : undefined
      });
      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(() => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        onLogin(user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const fillAndLogin = async (username, password) => {
    setLoginUsername(username);
    setLoginPassword(password);
    setTab('login');
    setError('');
    setLoading(true);
    try {
      const user = await api.login({ username, password });
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-orange-100 overflow-hidden"
      >
        {/* Top Accent Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 text-white text-center relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <img src="/snapit_logo.png" alt="snapit logo" className="h-7 w-auto drop-shadow" />
            </div>
            <span className="text-3xl font-black tracking-tight drop-shadow-sm">snapit</span>
          </div>
          <p className="text-orange-100 text-xs font-medium tracking-wide">
            Real-Time Campus Dining & Queue Intelligence
          </p>

          {/* Database Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MongoDB Cloud/Local Active
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SIGN IN TAB */}
          {tab === 'login' && (
            <motion.form 
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. Harish or student@snapit.edu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to snapit</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* REGISTER TAB */}
          {tab === 'register' && (
            <motion.form 
              key="register-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegisterSubmit} 
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a username (e.g. alex_smith)"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Campus Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. student@snapit.edu"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                      regRole === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <GraduationCap size={16} />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('staff')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                      regRole === 'staff'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Store size={16} />
                    <span>Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                      regRole === 'admin'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Canteen selector if staff */}
              {regRole === 'staff' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Assigned Canteen
                  </label>
                  <select
                    value={regCanteenId}
                    onChange={(e) => setRegCanteenId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="A">Main Canteen (A)</option>
                    <option value="B">Food Court (B)</option>
                    <option value="C">Snack Corner (C)</option>
                  </select>
                </div>
              )}

              {/* Password inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 chars"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[11px] text-gray-500 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRegPassword}
                    onChange={(e) => setShowRegPassword(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>Show password</span>
                </label>
                {regRole === 'student' && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    🎁 Includes ₹500 Valet
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Create snapit Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Zap size={13} className="text-amber-500" />
                Quick Demo Access
              </span>
              <span className="text-[10px] text-gray-400">1-click test login</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillAndLogin('Harish', 'password')}
                disabled={loading}
                className="p-2 bg-blue-50/70 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-xl text-center transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm">👨‍🎓</span>
                <span className="text-[11px] font-bold">Student</span>
                <span className="text-[9px] text-blue-500 opacity-80">Harish</span>
              </button>

              <button
                type="button"
                onClick={() => fillAndLogin('CounterA', 'password')}
                disabled={loading}
                className="p-2 bg-amber-50/70 hover:bg-amber-100 text-amber-800 border border-amber-100 rounded-xl text-center transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm">🏪</span>
                <span className="text-[11px] font-bold">Staff</span>
                <span className="text-[9px] text-amber-600 opacity-80">Counter A</span>
              </button>

              <button
                type="button"
                onClick={() => fillAndLogin('Admin', 'password')}
                disabled={loading}
                className="p-2 bg-purple-50/70 hover:bg-purple-100 text-purple-800 border border-purple-100 rounded-xl text-center transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm">👑</span>
                <span className="text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-purple-600 opacity-80">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
