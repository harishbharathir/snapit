import React, { useEffect, useState } from 'react';
import { api } from '../api';
import OrderCard from '../components/OrderCard';
import BottleneckAlert from '../components/BottleneckAlert';
import QRScannerTab from '../components/QRScannerTab';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio, ListOrdered, QrCode } from 'lucide-react';

const CounterPage = () => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [orders, setOrders] = useState([]);
  const [crowdData, setCrowdData] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'scanner'

  useEffect(() => {
    api.getCanteens().then(data => {
      setCanteens(data);
      if (data.length > 0) setSelectedCanteen(data[0].id);
    });
  }, []);

  const fetchData = async () => {
    if (!selectedCanteen) return;
    try {
      const [pendingOrders, zoneData] = await Promise.all([
        api.getPendingOrders(selectedCanteen),
        api.getCrowdZones(selectedCanteen)
      ]);
      setOrders(pendingOrders);
      setCrowdData(zoneData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedCanteen]);

  const handleUpdateStatus = async (orderId, newStatus, type = 'all') => {
    await api.updateOrderStatus(orderId, newStatus, type);
    fetchData();
  };

  const zones = crowdData?.zones || [];
  const bottleneckZone = zones.find(z => (z.occupancy_percentage || 0) > 70);
  const canteenName = canteens.find(c => c.id === selectedCanteen)?.name || selectedCanteen;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Counter Mode — {canteenName}</h1>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Radio size={12} /> ONLINE
          </span>
        </div>
        <select 
          value={selectedCanteen}
          onChange={(e) => setSelectedCanteen(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm"
        >
          {canteens.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${activeTab === 'queue' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
        >
          <ListOrdered size={18} /> Pending Orders ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${activeTab === 'scanner' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
        >
          <QrCode size={18} /> Scanner & Crowd Cam
        </button>
      </div>

      {activeTab === 'scanner' ? (
        <QRScannerTab 
          selectedCanteen={selectedCanteen} 
          orders={orders} 
          onUpdateStatus={handleUpdateStatus} 
        />
      ) : (
        <>
          {/* Zone Status */}
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Zone Alerts</h2>
            <div className="grid grid-cols-3 gap-3">
              {zones.map((z, i) => {
                const occ = z.occupancy_percentage || 0;
                let statusColor = 'text-green-600';
                let statusIcon = '🟢';
                let message = 'Clear — normal operations';
                if (occ > 70) {
                  statusColor = 'text-red-600';
                  statusIcon = '🔴';
                  message = `Busy — ${z.people_count} people`;
                } else if (occ > 40) {
                  statusColor = 'text-amber-600';
                  statusIcon = '🟡';
                  message = `Moderate — ${z.people_count} people`;
                }
                return (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{statusIcon}</span>
                      <span className="font-semibold text-sm">{z.zone_name || z.zone_id}</span>
                    </div>
                    <p className={`text-xs ${statusColor}`}>{message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {bottleneckZone && (
            <BottleneckAlert 
              zone={bottleneckZone} 
              recommendation="Consider opening additional counter or redirecting students."
            />
          )}

          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              Pending Orders
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{orders.length}</span>
            </h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 text-gray-500">
                <p className="text-lg mb-1">🍳</p>
                No pending orders at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {orders.map(order => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CounterPage;
