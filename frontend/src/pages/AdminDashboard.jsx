import React, { useEffect, useState } from 'react';
import { api } from '../api';
import MetricCard from '../components/MetricCard';
import ZoneHeatmap from '../components/ZoneHeatmap';
import { ShoppingCart, IndianRupee, Clock, Users, RefreshCw, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const CANTEEN_NAMES = { A: 'Main Canteen', B: 'Food Court', C: 'Snack Corner' };

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [allCrowdData, setAllCrowdData] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sum, peak, crowd, rec] = await Promise.all([
        api.getSummary(),
        api.getPeakHours(),
        api.getAllCrowdData(),
        api.getRecommendations()
      ]);
      setSummary(sum);
      setPeakHours(peak);   // Already an array from backend
      setAllCrowdData(crowd); // Object keyed by canteen_id
      setRecommendations(rec);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await api.refreshCrowd();
    fetchData();
  };

  const handleDownloadReport = () => {
    const date = new Date().toISOString().split('T')[0];
    const rows = [
      ['SnapIt Campus Report', `Generated: ${new Date().toLocaleString()}`],
      [''],
      ['=== ORDER SUMMARY ===', ''],
      ['Metric', 'Value'],
      ['Total Orders Today', summary?.total_orders || 0],
      ['Total Revenue (INR)', summary?.total_revenue || 0],
      ['Average Wait Time (min)', summary?.avg_wait_time || 0],
      ['Active Users', summary?.active_users || 0],
      [''],
      ['=== CROWD DATA ===', ''],
      ['Canteen', 'Occupancy (%)', 'Total People', 'Status'],
    ];

    Object.entries(allCrowdData).forEach(([cid, data]) => {
      rows.push([
        CANTEEN_NAMES[cid] || cid,
        Math.round(data.occupancy_percentage || 0),
        data.total_people || 0,
        data.status || 'N/A'
      ]);
    });

    rows.push(['']);
    rows.push(['=== ZONE BREAKDOWN ===', '', '', '']);
    rows.push(['Canteen', 'Zone', 'People Count', 'Occupancy (%)']);
    Object.entries(allCrowdData).forEach(([cid, data]) => {
      (data.zones || []).forEach(z => {
        rows.push([
          CANTEEN_NAMES[cid] || cid,
          z.zone_name || z.zone_id,
          z.people_count || 0,
          Math.round(z.occupancy_percentage || 0),
        ]);
      });
    });

    if (peakHours.length > 0) {
      rows.push(['']);
      rows.push(['=== PEAK HOURS ===', '', '']);
      rows.push(['Hour', 'Occupancy (%)', 'Orders']);
      peakHours.forEach(h => rows.push([h.label, h.occupancy, h.orders]));
    }

    // Use Blob instead of encodeURI to handle special chars (₹, commas, etc.)
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `snapit_report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Build alerts from crowd data
  const alerts = [];
  Object.entries(allCrowdData).forEach(([cid, data]) => {
    const zones = data.zones || [];
    zones.forEach(z => {
      const occ = z.occupancy_percentage || 0;
      if (occ > 70) {
        alerts.push({
          level: 'CRITICAL',
          text: `${CANTEEN_NAMES[cid] || cid} — ${z.zone_name}: ${Math.round(occ)}% occupancy`,
          recommendation: `Consider redirecting to another canteen`,
        });
      } else if (occ > 50) {
        alerts.push({
          level: 'WARNING',
          text: `${CANTEEN_NAMES[cid] || cid} — ${z.zone_name}: ${Math.round(occ)}% occupancy`,
        });
      }
    });
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Command Center</h1>
          <p className="text-sm text-gray-500">Real-time crowd intelligence & analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-bold transition">
            <Download size={16} /> Download Report
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-sm font-medium transition">
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Orders Today" value={summary?.total_orders || 0} icon={ShoppingCart} trend={summary?.total_orders_trend ?? 0} />
        <MetricCard title="Revenue" value={`₹${(summary?.total_revenue || 0).toLocaleString()}`} icon={IndianRupee} trend={summary?.total_revenue_trend ?? 0} />
        <MetricCard title="Avg Wait Time" value={`${summary?.avg_wait_time || 0} min`} icon={Clock} trend={summary?.avg_wait_time_trend ?? 0} />
        <MetricCard title="Active Users" value={summary?.active_users || 0} icon={Users} trend={summary?.active_users_trend ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crowd Intelligence — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">🔥 Crowd Intelligence — Live Heatmaps</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(allCrowdData).map(([cid, data]) => (
                <div key={cid} className="bg-gray-50 rounded-xl overflow-hidden border flex flex-col shadow-sm">
                  {/* Live Video Feed Player */}
                  <div className="relative aspect-video bg-black overflow-hidden group">
                    <video
                      src={`/videos/canteen_${cid}.mp4`}
                      poster={`/images/canteen_${cid}_placeholder.jpg`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Blinking Live Indicator */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm shadow z-10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      LIVE AI CAMERA
                    </div>
                    {/* Occupancy Indicator Overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm z-10 animate-pulse">
                      YOLOv8 Active
                    </div>
                  </div>
                  
                  {/* Canteen Header Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{data.canteen_name || CANTEEN_NAMES[cid] || `Canteen ${cid}`}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          data.status === 'HIGH' ? 'bg-red-100 text-red-700' 
                          : data.status === 'MEDIUM' ? 'bg-amber-100 text-amber-700' 
                          : 'bg-green-100 text-green-700'
                        }`}>
                          {Math.round(data.occupancy_percentage || 0)}% Occupied
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">🎥 Feed: {cid === 'A' ? 'Central Lobby' : cid === 'B' ? 'Dining Corridor' : 'Counter Entrance'}</p>
                    </div>

                    <div>
                      <ZoneHeatmap zones={data.zones || []} />
                      {data.hottest_zone && (
                        <p className="text-xs font-medium text-gray-600 mt-3 flex justify-between">
                          <span>Hottest Zone:</span> 
                          <span className="text-orange-600 font-semibold">{data.hottest_zone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone comparison table */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">Zone Comparison Across Canteens</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Zone</th>
                    {Object.keys(allCrowdData).map(cid => (
                      <th key={cid} className="text-center py-2 px-3 text-gray-500 font-medium">
                        {CANTEEN_NAMES[cid] || cid}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Counter', 'Seating', 'Entry'].map(zoneName => (
                    <tr key={zoneName} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{zoneName}</td>
                      {Object.entries(allCrowdData).map(([cid, data]) => {
                        const zone = (data.zones || []).find(z => (z.zone_name || '').includes(zoneName));
                        const occ = zone?.occupancy_percentage || 0;
                        const people = zone?.people_count || 0;
                        let color = 'text-green-600';
                        let dot = '🟢';
                        if (occ > 70) { color = 'text-red-600'; dot = '🔴'; }
                        else if (occ > 40) { color = 'text-amber-600'; dot = '🟡'; }
                        return (
                          <td key={cid} className={`text-center py-3 px-3 font-semibold ${color}`}>
                            {dot} {Math.round(occ)}% <span className="text-xs text-gray-400">({people})</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Peak hours chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">Peak Hours Analysis</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="occupancy" fill="#f97316" radius={[4, 4, 0, 0]} name="Occupancy %" />
                  <Bar dataKey="orders" fill="#fb923c" radius={[4, 4, 0, 0]} name="Orders" opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-6">
          {/* AI Recommendation */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">🧠 AI Recommendations</h2>
            {recommendations?.recommendation_text && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800 text-sm mb-4 font-medium">
                {recommendations.recommendation_text}
              </div>
            )}
            
            {/* Per-canteen summary */}
            <div className="space-y-2">
              {recommendations?.all_canteens?.map(r => (
                <div key={r.canteen_id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <span className="font-medium">{r.canteen_name}</span>
                  <span className={`font-bold ${r.estimated_wait > 10 ? 'text-red-600' : r.estimated_wait > 5 ? 'text-amber-600' : 'text-green-600'}`}>
                    ~{Math.round(r.estimated_wait)} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">⚠️ System Alerts</h2>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="p-3 rounded border bg-green-50 border-green-200 text-green-700 text-sm">
                  ✓ All systems operational. No active bottlenecks.
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded border text-sm ${
                    alert.level === 'CRITICAL' 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <span className="font-bold">{alert.level}:</span> {alert.text}
                    {alert.recommendation && (
                      <p className="text-xs mt-1 opacity-80">💡 {alert.recommendation}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
