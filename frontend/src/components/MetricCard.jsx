import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend }) => {
  const isUp = trend > 0;
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
      <div className="flex justify-between items-center text-gray-500">
        <span className="text-sm font-medium">{title}</span>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
