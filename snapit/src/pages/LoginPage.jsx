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
  AlertCircle, 
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  UtensilsCrossed,
  Heart
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
      if (user.role !== 'student') {
        setError(`This account is registered for ${user.role}s. Please use the SnapIt Partner app to access partner terminals.`);
        setLoading(false);
        return;
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
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
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const user = await api.register({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
        role: 'student'
      });
      setSuccessMsg('Account created successfully! Welcome to SnapIt.');
      setTimeout(() => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        onLogin(user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. That username may already be in use.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Background Decorative Blur Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-stone-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: SWIGGY/ZOMATO STYLE CULINARY SHOWCASE (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 p-8 flex-col justify-between overflow-hidden text-white">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Food Hero Image with soft vignette */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/food_pizza.jpg" 
              alt="Delicious food" 
              className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 transform hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/90 via-orange-900/60 to-orange-800/40" />
          </div>

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase">Campus Dining Network</span>
            </div>
          </div>

          {/* Center Visual Callout Card */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-500/30 border border-orange-300/30 backdrop-blur-md text-orange-100 text-xs font-bold">
              <Flame size={14} className="text-amber-300 fill-amber-300" />
              <span>Zero Queues • Fresh & Hot</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              Your favourite campus meals, <br />
              <span className="text-amber-300 font-serif italic">ready when you are.</span>
            </h1>

            <p className="text-orange-100/90 text-sm leading-relaxed max-w-sm">
              Browse live menus from Main Canteen, Food Court, and Snack Corner. Order ahead and pick up with your instant QR pass.
            </p>

            {/* Floating Live Badge */}
            <div className="pt-2">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Average Pickup Time</span>
                    <span className="text-[10px] bg-emerald-500/80 px-1.5 py-0.2 rounded-full">Fast</span>
                  </div>
                  <div className="text-sm font-extrabold text-amber-300">5 – 8 Minutes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-orange-200">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Verified Campus Cafeterias</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-rose-400 fill-rose-400" />
              <span>Made for Students</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN CLEAN AUTHENTICATION FORM */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          {/* Top Brand Logo & Segmented Switcher */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1.5">
                    <img src="/snapit_logo.png" alt="SnapIt Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-gray-900 leading-none block">snapit</span>
                  <span className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">Food Booking</span>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="bg-stone-100/80 p-1 rounded-2xl flex items-center border border-stone-200/60">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Heading text */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {tab === 'login' ? 'Welcome Back 👋' : 'Create an Account 🍽️'}
              </h2>
              <p className="text-stone-500 text-xs sm:text-sm mt-1.5 font-medium">
                {tab === 'login' 
                  ? 'Sign in with your student credentials to order food instantly' 
                  : 'Join campus dining to skip long food counter queues and enjoy hot meals'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2.5"
                >
                  <AlertCircle size={17} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2.5"
                >
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB: SIGN IN */}
            {tab === 'login' && (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Username or Campus Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your student username or email"
                      required
                      autoComplete="username"
                      className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-11 pr-11 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition cursor-pointer"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Dining</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* TAB: SIGN UP */}
            {tab === 'register' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Student Name or Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. John Doe or alex24"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Campus Email (Optional)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@campus.edu"
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      required
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-stone-500 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded border-stone-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span>Show password</span>
                  </label>

                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Sparkles size={12} className="text-emerald-500" />
                    <span>Includes ₹500 Welcome Balance</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account & Start Ordering</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </div>

          {/* Bottom Security & Legal Footer */}
          <div className="pt-6 mt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>100% Encrypted & Secure Dining Account</span>
            </div>
            <div>
              By continuing, you agree to SnapIt's <a href="#" className="underline hover:text-stone-600">Terms</a> & <a href="#" className="underline hover:text-stone-600">Privacy Policy</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
