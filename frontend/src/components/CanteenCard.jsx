import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, AlertTriangle, MapPin } from 'lucide-react';

const CanteenCard = ({ canteen, recommended }) => {
  const navigate = useNavigate();
  
  // Get crowd data — from the enriched crowdData object or fallback to crowd_data array
  const crowdData = canteen.crowdData || {};
  const zones = crowdData.zones || canteen.crowd_data || [];
  const avgCrowd = crowdData.occupancy_percentage 
    ?? (zones.length > 0 
      ? zones.reduce((acc, z) => acc + (z.occupancy_percentage || 0), 0) / zones.length 
      : 0);
  
  let statusColor = "bg-green-100 text-green-700 border-green-500";
  let statusText = "ENTRY CLEAR";
  let indicator = "🟢";
  
  if (avgCrowd > 70) {
    statusColor = "bg-red-100 text-red-700 border-red-500";
    statusText = "COUNTER BOTTLENECK";
    indicator = "🔴";
  } else if (avgCrowd > 40) {
    statusColor = "bg-amber-100 text-amber-700 border-amber-500";
    statusText = "MODERATELY BUSY";
    indicator = "🟡";
  }

  // Find counter zone for wait time
  const counterZone = zones.find(z => 
    (z.zone_name || z.zone_id || '').toLowerCase().includes('counter')
  );
  const counterPeople = counterZone?.people_count || 0;
  const waitTime = crowdData.estimated_wait_minutes || Math.ceil(counterPeople * 0.8 + 2);

  // Check for bottleneck
  const hottest = crowdData.hottest_zone;
  const bottleneck = crowdData.bottleneck_alert;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden p-0 flex flex-col gap-0 relative cursor-pointer`}
      onClick={() => navigate(`/menu/${canteen.id}`)}
    >
      {/* Top Image Header */}
      <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
        <img 
          src={canteen.image_url || '/snapit_logo.png'} 
          alt={canteen.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95" 
        />
        {recommended && (
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm z-10">
            ⭐ RECOMMENDED
          </div>
        )}
        <div className="absolute bottom-2 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
          {canteen.location}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800">{canteen.name}</h3>
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor.split(' ')[0]} ${statusColor.split(' ')[1]} border ${statusColor.split(' ')[2]}`}>
            {indicator} {Math.round(avgCrowd)}%
          </div>
        </div>

        {/* Status tag */}
        <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full w-fit ${statusColor.split(' ')[0]} ${statusColor.split(' ')[1]}`}>
          {bottleneck ? `⚠️ ${bottleneck}` : `✓ ${statusText}`}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 my-1">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <span>{counterPeople} at counter</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span>~{Math.round(waitTime)} min wait</span>
          </div>
        </div>

        {/* Mini zone bars */}
        <div className="flex gap-1 h-1.5 rounded overflow-hidden">
          {zones.map((z, i) => {
            const occ = z.occupancy_percentage || 0;
            let bg = 'bg-green-400';
            if (occ > 70) bg = 'bg-red-400';
            else if (occ > 40) bg = 'bg-amber-400';
            return <div key={i} className={`flex-1 ${bg} rounded`} title={`${z.zone_name}: ${Math.round(occ)}%`} />;
          })}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/menu/${canteen.id}`); }}
          className="w-full mt-2 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-sm rounded-lg transition flex justify-center items-center gap-2"
        >
          Order Now <span>&rarr;</span>
        </button>
      </div>
    </motion.div>
  );
};

export default CanteenCard;
