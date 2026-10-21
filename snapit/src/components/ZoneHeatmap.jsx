import React from 'react';
import { motion } from 'framer-motion';

const ZoneHeatmap = ({ zones }) => {
  if (!zones || zones.length === 0) return <div className="text-gray-400 text-xs text-center py-4">No zone data</div>;

  return (
    <div className="grid grid-cols-3 gap-2">
      {zones.map((zone, i) => {
        const occ = zone.occupancy_percentage || 0;
        const name = zone.zone_name || zone.zone_id || 'Zone';
        let color = "bg-green-500";
        if (occ > 70) color = "bg-red-500";
        else if (occ > 40) color = "bg-amber-500";

        return (
          <div key={i} className="bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden h-24">
            <motion.div 
              className={`absolute bottom-0 left-0 right-0 opacity-20 ${color}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(occ, 100)}%` }}
              transition={{ duration: 1 }}
            />
            <span className="text-xs font-semibold text-gray-700 relative z-10">{name}</span>
            <span className="text-lg font-bold text-gray-900 relative z-10">{Math.round(occ)}%</span>
            <span className="text-[10px] text-gray-500 relative z-10">{zone.people_count || 0} people</span>
            {occ > 70 && (
              <span className="absolute top-1 right-1 text-red-500 text-xs">⚠️</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ZoneHeatmap;
