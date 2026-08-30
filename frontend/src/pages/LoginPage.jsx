import React, { useState } from 'react';
import { api } from '../api';
import { motion } from 'framer-motion';

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const user = await api.login({ username, password });
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-2 mb-2">
            <img src="/snapit_logo.png" alt="snapit logo" className="h-10 w-auto inline-block" /> snapit
          </h1>
          <p className="text-gray-500">Hackathon Demo Login</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('Harish', 'password')}
            disabled={loading}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-xl transition flex justify-between items-center"
          >
            <span>👨‍🎓 Login as Student (Harish)</span>
            <span>&rarr;</span>
          </button>
          
          <button 
            onClick={() => handleLogin('CounterA', 'password')}
            disabled={loading}
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3 px-4 rounded-xl transition flex justify-between items-center"
          >
            <span>🏪 Login as Staff (Counter A)</span>
            <span>&rarr;</span>
          </button>
          
          <button 
            onClick={() => handleLogin('Admin', 'password')}
            disabled={loading}
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 px-4 rounded-xl transition flex justify-between items-center"
          >
            <span>👑 Login as System Admin</span>
            <span>&rarr;</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
