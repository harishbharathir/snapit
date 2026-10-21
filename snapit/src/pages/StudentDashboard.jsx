import React, { useEffect, useState } from 'react';
import { api } from '../api';
import CanteenCard from '../components/CanteenCard';
import { Sparkles, Wallet, Flame, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = ({ currentUser, onUpdateUser }) => {
  const [canteens, setCanteens] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const canteensData = await api.getCanteens();

      // Fetch crowd zones for each canteen
      const canteensWithZones = await Promise.all(canteensData.map(async (c) => {
        try {
          const crowdData = await api.getCrowdZones(c.id);
          return { ...c, crowdData };
        } catch {
          return { ...c, crowdData: null };
        }
      }));

      setCanteens(canteensWithZones);

      const rec = await api.getRecommendations();
      setRecommendation(rec);
      
      // Fetch specials from all menus
      const allSpecials = [];
      for (const c of canteensData) {
        const menu = await api.getMenu(c.id);
        const canteenSpecials = menu.filter(m => m.is_special).map(m => ({ ...m, canteen_name: c.name }));
        allSpecials.push(...canteenSpecials);
      }
      setSpecials(allSpecials);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddFunds = async () => {
    try {
      const res = await api.addWallet(currentUser.id, 100);
      onUpdateUser({ ...currentUser, wallet_balance: res.wallet_balance });
      alert('₹100 added to Valet Card!');
    } catch (err) {
      alert('Failed to add funds');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm">Loading canteen data...</p>
      </div>
    );
  }

  const bestCanteenId = recommendation?.best_canteen?.canteen_id;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good afternoon, {currentUser?.username} 👋</h1>
          <p className="text-gray-500">What are you craving today?</p>
        </div>
        
        {/* Valet Card Widget */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-xl shadow-md text-white flex items-center justify-between gap-6 min-w-[300px]">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1 flex items-center gap-1"><Wallet size={16}/> Valet Card</p>
            <p className="text-3xl font-bold">₹{currentUser?.wallet_balance}</p>
          </div>
          <button 
            onClick={handleAddFunds}
            className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-50 transition"
          >
            + Add ₹100
          </button>
        </div>
      </header>

      {recommendation && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-xl p-4 flex items-center gap-3 shadow-sm"
        >
          <Sparkles className="text-orange-500 shrink-0" />
          <span className="font-medium text-orange-900">
            ✨ AI Analysis: {recommendation.recommendation_text}
          </span>
        </motion.div>
      )}

      {/* Today's Specials */}
      {specials.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Flame className="text-red-500" /> Today's Specials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {specials.map(item => (
              <div key={item.id} className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm relative group">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                  SPECIAL
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{item.canteen_name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-lg text-red-600">₹{item.price}</span>
                    <button onClick={() => navigate(`/menu/${item.canteen_id}`)} className="text-sm font-bold text-orange-500 flex items-center group-hover:underline">
                      Order <ArrowRight size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold mb-4">Live Canteen Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canteens.map(canteen => (
            <CanteenCard 
              key={canteen.id} 
              canteen={canteen} 
              recommended={canteen.id === bestCanteenId} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
