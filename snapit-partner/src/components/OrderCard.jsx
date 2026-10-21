import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const OrderCard = ({ order, onUpdateStatus }) => {
  const timeSince = Math.floor((new Date() - new Date(order.created_at)) / 60000);
  
  const statusColors = {
    'PENDING': 'bg-gray-100 text-gray-700',
    'PREPARING': 'bg-amber-100 text-amber-700',
    'READY': 'bg-green-100 text-green-700',
    'SERVED': 'bg-blue-100 text-blue-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono font-bold text-lg">#{(order.id || '').slice(0, 8).toUpperCase()}</span>
          <p className="text-sm text-gray-600 font-medium">{order.student_name}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {order.items.map((item, i) => (
          <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {item.quantity}x {item.name || item.item_name}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          <span>{timeSince} mins ago</span>
        </div>
        <div className="font-bold">₹{order.total_amount}</div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2">
        {order.status === 'PENDING' && (
          <button onClick={() => onUpdateStatus(order.id, 'PREPARING')} className="bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-sm font-medium">
            Start Preparing
          </button>
        )}
        {order.status === 'PREPARING' && (
          <button onClick={() => onUpdateStatus(order.id, 'READY')} className="bg-green-500 hover:bg-green-600 text-white py-1.5 rounded text-sm font-medium">
            Mark Ready
          </button>
        )}
        {order.status === 'READY' && (
          <button onClick={() => onUpdateStatus(order.id, 'SERVED')} className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded text-sm font-medium">
            Mark Served
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default OrderCard;
