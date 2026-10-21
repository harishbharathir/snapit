import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const BottleneckAlert = ({ zone, recommendation }) => {
  const occ = zone?.occupancy_percentage || 0;
  const name = zone?.zone_name || zone?.zone_id || 'Zone';
  
  return (
    <motion.div
      className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="shrink-0 mt-0.5">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="text-red-500" size={20} />
        </motion.div>
      </div>
      <div>
        <h4 className="font-bold text-red-800">⚠️ Bottleneck Alert</h4>
        <p className="text-red-700 text-sm">
          {name} is <span className="font-bold">{Math.round(occ)}%</span> full
          ({zone?.people_count || 0} people)
        </p>
        {recommendation && (
          <p className="text-red-600 text-xs mt-1.5">
            💡 {recommendation}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BottleneckAlert;
