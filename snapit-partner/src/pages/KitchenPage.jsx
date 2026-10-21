import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, WS_BASE_URL } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Utensils, 
  Coffee, 
  Cookie, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  AlertTriangle,
  Play,
  Check,
  Radio,
  Send,
  Building2,
  Package,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.25); // C6
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.error("Audio error", e);
  }
};

const KitchenPage = ({ currentUser }) => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('ALL');
  const [requests, setRequests] = useState([]);
  const [batchSummary, setBatchSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' | 'canteens'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'HOT' | 'SNACK'
  const prevCountRef = useRef(0);

  // Load canteens list
  useEffect(() => {
    api.getCanteens().then(data => {
      setCanteens(data || []);
    }).catch(err => console.error("Error loading canteens", err));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [reqList, summary] = await Promise.all([
        api.getKitchenRequests(selectedCanteen, 'ACTIVE'),
        api.getKitchenBatchSummary()
      ]);
      const active = reqList || [];
      if (soundEnabled && active.length > prevCountRef.current && prevCountRef.current > 0) {
        playChime();
      }
      prevCountRef.current = active.length;
      setRequests(active);
      setBatchSummary(summary || []);
    } catch (err) {
      console.error("Error fetching factory distributor data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCanteen, soundEnabled]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Connect WebSocket for instant notifications
  useEffect(() => {
    let ws = null;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/api/ws/kitchen_distributor`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_KITCHEN_REQUEST' || msg.type === 'RESTOCK_COMPLETED') {
            fetchData();
            if (soundEnabled && msg.type === 'NEW_KITCHEN_REQUEST') {
              playChime();
            }
          }
        } catch (e) {
          console.error("WS Parse err", e);
        }
      };
    } catch (err) {
      console.warn("WebSocket connection not available, falling back to polling", err);
    }
    return () => {
      if (ws) ws.close();
    };
  }, [fetchData, soundEnabled]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await api.updateKitchenRequestStatus(requestId, newStatus);
      fetchData();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleBatchCook = async (requestIds, newStatus) => {
    try {
      await api.batchCookRequests(requestIds, newStatus);
      fetchData();
    } catch (err) {
      console.error("Failed batch cook", err);
    }
  };

  // Metrics
  const requestedCount = requests.filter(r => r.status === 'REQUESTED').length;
  const cookingCount = requests.filter(r => r.status === 'COOKING').length;
  const cookedCount = requests.filter(r => r.status === 'COOKED').length;
  const totalUnitsNeeded = requests
    .filter(r => ['REQUESTED', 'COOKING'].includes(r.status))
    .reduce((sum, r) => sum + (r.requested_quantity || 0), 0);

  // Filter requests according to category
  const filteredRequests = requests.filter(req => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'HOT') {
      return ['South Indian', 'North Indian', 'Chinese', 'Fast Food', 'Specials'].includes(req.category);
    }
    if (categoryFilter === 'SNACK') {
      return ['Snacks', 'Desserts', 'Beverages'].includes(req.category);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Central Factory Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Factory size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Central Kitchen • Factory Distributor</h1>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <Radio size={12} className="animate-pulse" /> CAMPUS COMMISSARY
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Bulk production & dispatch hub supplying all <span className="text-amber-400 font-bold">{canteens.length || 11} Institution Canteens</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Canteen Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 size={14} className="text-slate-400" />
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All 11 Canteens</option>
              {canteens.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Alert chimes enabled' : 'Sound muted'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh demand queue"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Production Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Campus Demand</span>
            <span className="text-2xl font-black text-amber-400">{totalUnitsNeeded} <span className="text-xs font-semibold text-slate-400">units</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Waiting to Cook</span>
            <span className="text-2xl font-black text-orange-400">{requestedCount} <span className="text-xs font-semibold text-slate-400">batches</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Production</span>
            <span className="text-2xl font-black text-blue-400">{cookingCount} <span className="text-xs font-semibold text-slate-400">batches</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Utensils size={22} />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Dispatched & Notified</span>
            <span className="text-2xl font-black text-emerald-400">{cookedCount} <span className="text-xs font-semibold text-slate-400">batches</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Send size={20} />
          </div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            Campus Batch Cooking ({batchSummary.length})
          </button>

          <button
            onClick={() => setActiveTab('canteens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
              activeTab === 'canteens'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Building2 size={15} />
            Canteen Dispatch Tickets ({filteredRequests.length})
          </button>
        </div>

        {/* Sub-Filters */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              categoryFilter === 'ALL'
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setCategoryFilter('HOT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              categoryFilter === 'HOT'
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Lunches & Meals
          </button>
          <button
            onClick={() => setCategoryFilter('SNACK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              categoryFilter === 'SNACK'
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Snacks & Beverages
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: BATCH PRODUCTION VIEW */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200">Bulk Cooking Optimizer:</span> Chef cooks large batches in factory kitchen and dispatches simultaneously to all demanding canteens.
            </div>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles size={13} /> {batchSummary.length} Active Production Batches
            </span>
          </div>

          {batchSummary.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-800 rounded-3xl text-slate-400">
              <Factory size={48} className="mx-auto mb-3 text-slate-700" />
              <h3 className="text-base font-bold text-slate-300">All 11 Canteens Are Fully Stocked!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No snack or lunch depletions detected. When any canteen counter runs low on food, restock requests will appear here immediately with audio alerts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {batchSummary.map((item) => {
                  const reqIds = item.request_ids || [];
                  const isCooking = item.has_cooking;

                  return (
                    <motion.div
                      key={item.item_name}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                              {item.category}
                            </span>
                            <h3 className="text-lg font-black text-white mt-1.5">{item.item_name}</h3>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 block font-semibold">Total Needed</span>
                            <span className="text-2xl font-black text-amber-400">{item.total_requested}</span>
                          </div>
                        </div>

                        {/* Requesting Canteens List */}
                        <div className="mt-4 space-y-2">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                            Destination Canteens ({item.canteens?.length || 0})
                          </span>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {(item.canteens || []).map((c, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/60 border border-slate-800 px-3 py-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center justify-center">
                                    {c.canteen_id}
                                  </span>
                                  <span className="font-semibold text-slate-200">{c.canteen_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white">+{c.quantity}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    c.status === 'COOKING'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {c.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 pt-4 border-t border-slate-800/80 flex gap-2">
                        {!isCooking ? (
                          <button
                            onClick={() => handleBatchCook(reqIds, 'COOKING')}
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play size={14} className="fill-current" />
                            <span>Start Cooking Batch ({item.total_requested})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBatchCook(reqIds, 'COOKED')}
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send size={14} />
                            <span>Mark Cooked & Dispatch ({item.total_requested})</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 2: CANTEEN DISPATCH TICKETS */}
      {activeTab === 'canteens' && (
        <div>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-800 rounded-3xl text-slate-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-slate-700" />
              <h3 className="text-base font-bold text-slate-300">No Pending Canteen Tickets</h3>
              <p className="text-xs text-slate-500 mt-1">All replenishment supply tickets are fulfilled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredRequests.map((req) => {
                  const minutesAgo = Math.max(0, Math.floor((new Date() - new Date(req.created_at)) / 60000));
                  const isOutOfStock = req.current_inventory <= 0;
                  const isLow = req.current_inventory > 0 && req.current_inventory <= 10;

                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition ${
                        isOutOfStock 
                          ? 'bg-slate-900 border-red-500/80 shadow-red-500/10'
                          : req.status === 'COOKED'
                          ? 'bg-slate-900 border-emerald-500/60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className={`p-4 border-b flex justify-between items-start ${
                        isOutOfStock
                          ? 'bg-red-500/10 border-red-500/20'
                          : req.status === 'COOKED'
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-slate-800/40 border-slate-800'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm tracking-wide text-white">
                              {req.id}
                            </span>
                            {isOutOfStock ? (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <AlertTriangle size={10} /> OUT OF STOCK
                              </span>
                            ) : isLow ? (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                LOW STOCK ({req.current_inventory})
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold mt-1">
                            <Building2 size={13} className="text-orange-400" />
                            <span>{req.canteen_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                          <Clock size={12} />
                          <span>{minutesAgo}m ago</span>
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-4 space-y-3 flex-1">
                        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Requested Item & Category</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-base font-black text-white">{req.item_name}</span>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              {req.category}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Supply Batch</span>
                            <span className="text-lg font-black text-emerald-400">+{req.requested_quantity} units</span>
                          </div>

                          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Canteen Stock</span>
                            <span className={`text-lg font-black ${req.current_inventory <= 0 ? 'text-red-400' : 'text-slate-200'}`}>
                              {req.current_inventory} left
                            </span>
                          </div>
                        </div>

                        {req.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-800/30 p-2 rounded-lg border border-slate-800">
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0">
                        {req.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'COOKING')}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play size={14} className="fill-current" />
                            <span>Start Cooking Batch (+{req.requested_quantity})</span>
                          </button>
                        )}

                        {req.status === 'COOKING' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'COOKED')}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send size={15} />
                            <span>Mark Cooked & Notify Counter</span>
                          </button>
                        )}

                        {req.status === 'COOKED' && (
                          <div className="w-full py-2.5 px-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                            <CheckCircle2 size={15} />
                            <span>Dispatched • Notified {req.canteen_name}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
