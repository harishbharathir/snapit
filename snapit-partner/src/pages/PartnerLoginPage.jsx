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
  Store, 
  ShieldCheck, 
  ChefHat, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Radio,
  Building2,
  Cpu
} from 'lucide-react';

const PartnerLoginPage = ({ onLogin }) => {
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
  const [regRole, setRegRole] = useState('staff'); // 'staff' | 'kitchen' | 'admin'
  const [regCanteenId, setRegCanteenId] = useState('A');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      setError('Please enter your partner username and password');
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
      if (user.role === 'student') {
        setError('Student accounts are not authorized here. Please use the SnapIt Food Booking app.');
        setLoading(false);
        return;
      }
      localStorage.setItem('partnerUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify partner credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regUsername.trim()) {
      setError('Please enter a username');
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
        canteen_id: (regRole === 'staff' || regRole === 'kitchen') ? regCanteenId : undefined
      });
      setSuccessMsg('Partner account registered! Logging into operations terminal...');
      setTimeout(() => {
        localStorage.setItem('partnerUser', JSON.stringify(user));
        onLogin(user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Username may already exist.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-orange-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-[32rem] h-[32rem] bg-amber-500/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-800/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: ENTERPRISE OPERATIONS SHOWCASE (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-slate-900 via-slate-950 to-stone-950 p-8 flex-col justify-between border-r border-slate-800/80 text-slate-100">
          
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Top Status */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Merchant Terminal V2.4</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Radio size={12} className="text-emerald-400" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 space-y-5 my-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-2.5">
                <img src="/snapit_logo.png" alt="SnapIt Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div>
              <div className="text-xs font-black tracking-widest text-amber-400 uppercase mb-1">
                Partner Hub
              </div>
              <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white">
                Canteen & Kitchen <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  Operations Console
                </span>
              </h1>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Unified real-time management for order queues, kitchen preparation displays (KDS), camera QR redemption, and campus analytics.
            </p>

            {/* Feature Pills */}
            <div className="space-y-2.5 pt-2 max-w-sm">
              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Store size={18} />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-200">Counter Order Dispatch</div>
                  <div className="text-slate-400 text-[11px]">Instant live status & QR camera scanner</div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ChefHat size={18} />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-200">Kitchen Display System (KDS)</div>
                  <div className="text-slate-400 text-[11px]">Color-coded ticket alerts & station routing</div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Cpu size={18} />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-200">AI Crowd & Peak Analytics</div>
                  <div className="text-slate-400 text-[11px]">Live heatmap occupancy & report exports</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Role-Based Access Control</span>
            </div>
            <div>Institutional Level</div>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN B2B LOGIN & SIGNUP */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          <div>
            {/* Top Bar with Brand & Segmented Switcher */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center p-1.5">
                    <img src="/snapit_logo.png" alt="SnapIt Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-white leading-none block">snapit</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">PARTNER PORTAL</span>
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="bg-slate-800/80 p-1 rounded-2xl flex items-center border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Partner Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register Staff
                </button>
              </div>
            </div>

            {/* Header titles */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {tab === 'login' ? 'Partner Terminal Access' : 'Register Operator Account'}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
                {tab === 'login'
                  ? 'Sign in to access your canteen counter, kitchen KDS, or admin console'
                  : 'Add a new authorized canteen counter, kitchen chef, or admin account'}
              </p>
            </div>

            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 bg-red-950/60 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2.5"
                >
                  <AlertCircle size={17} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2.5"
                >
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB: SIGN IN */}
            {tab === 'login' && (
              <motion.form
                key="partner-signin"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Partner Username or Official Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. CounterA, KitchenA, or Admin"
                      required
                      autoComplete="username"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-11 pr-11 py-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Enter Partner Console</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* TAB: REGISTER STAFF */}
            {tab === 'register' && (
              <motion.form
                key="partner-signup"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Operator / Station Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. CounterEast or ChefRamesh"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Email (Optional)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="staff@snapit.edu"
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                {/* Role Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assign Operational Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('staff')}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        regRole === 'staff'
                          ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-300'
                      }`}
                    >
                      <Store size={18} />
                      <span className="text-xs font-bold">Counter Staff</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('kitchen')}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        regRole === 'kitchen'
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-300'
                      }`}
                    >
                      <ChefHat size={18} />
                      <span className="text-xs font-bold">Kitchen KDS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        regRole === 'admin'
                          ? 'border-purple-400 bg-purple-500/15 text-purple-300 shadow-sm'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-300'
                      }`}
                    >
                      <ShieldCheck size={18} />
                      <span className="text-xs font-bold">Administrator</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Canteen for Counter or Kitchen */}
                {(regRole === 'staff' || regRole === 'kitchen') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Assigned Canteen Station
                    </label>
                    <select
                      value={regCanteenId}
                      onChange={(e) => setRegCanteenId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white focus:outline-none focus:bg-slate-800 focus:border-orange-500"
                    >
                      <option value="A">Main Canteen (A) - Central Block</option>
                      <option value="B">Food Court (B) - East Wing</option>
                      <option value="C">Snack Corner (C) - Library Block</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      required
                      className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded border-slate-700 text-orange-500 focus:ring-orange-400"
                    />
                    <span>Show password</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Register Operator Terminal</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 mt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>TLS / AES-256 Encrypted Session</span>
            </div>
            <div>
              Institutional Operations Access Only
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PartnerLoginPage;
