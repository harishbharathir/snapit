import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import QRDisplay from '../components/QRDisplay';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchOrder();

    // Listen to real-time WebSocket updates emitted from the Layout component
    const handleStatusUpdate = (e) => {
      const update = e.detail;
      if (update.order_id === orderId) {
        setOrder(prev => prev ? { 
          ...prev, 
          status: update.status,
          tea_status: update.tea_status || prev.tea_status,
          snacks_status: update.snacks_status || prev.snacks_status
        } : null);
      }
    };

    window.addEventListener('orderStatusUpdate', handleStatusUpdate);
    
    const interval = setInterval(fetchOrder, 5000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderStatusUpdate', handleStatusUpdate);
    };
  }, [orderId]);

  if (!order) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const steps = ['PENDING', 'PREPARING', 'READY', 'SERVED'];
  const currentStep = steps.indexOf(order.status);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle size={32} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-1">Order Confirmed!</h2>
        <p className="text-gray-500">Thank you, {order.student_name}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-bold mb-4">Order Status</h3>
        
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-6 relative">
            {steps.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              let color = 'bg-gray-200';
              if (isPast) color = 'bg-green-500';
              if (isCurrent) color = 'bg-orange-500';

              return (
                <div key={step} className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${color}`}>
                    {isPast && <CheckCircle size={14} className="text-white" />}
                    {isCurrent && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                  </div>
                  <span className={`font-semibold ${isCurrent ? 'text-gray-900' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual QR Code Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.qr_code_tea && order.tea_status !== 'NONE' && (
          <div className="flex flex-col items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
            <div className="text-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5 justify-center">
                🍵 Tea & Beverages
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Scan at Tea Counter</p>
            </div>
            
            <div className="p-2 border-2 border-dashed border-gray-200 rounded-lg">
              <img src={`data:image/png;base64,${order.qr_code_tea}`} alt="Tea QR Code" className="w-40 h-40" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                order.tea_status === 'SERVED' ? 'bg-gray-100 text-gray-600' :
                order.tea_status === 'READY' ? 'bg-green-100 text-green-700 animate-pulse' :
                order.tea_status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {order.tea_status}
              </span>
              <span className="text-[10px] font-mono text-gray-400">Order ID: #{order.id.slice(0, 8)}</span>
            </div>
          </div>
        )}

        {order.qr_code_snacks && order.snacks_status !== 'NONE' && (
          <div className="flex flex-col items-center gap-4 bg-white p-5 rounded-xl shadow-sm border">
            <div className="text-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5 justify-center">
                🍔 Snacks & Food
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Scan at Food Counter</p>
            </div>
            
            <div className="p-2 border-2 border-dashed border-gray-200 rounded-lg">
              <img src={`data:image/png;base64,${order.qr_code_snacks}`} alt="Snacks QR Code" className="w-40 h-40" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                order.snacks_status === 'SERVED' ? 'bg-gray-100 text-gray-600' :
                order.snacks_status === 'READY' ? 'bg-green-100 text-green-700 animate-pulse' :
                order.snacks_status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {order.snacks_status}
              </span>
              <span className="text-[10px] font-mono text-gray-400">Order ID: #{order.id.slice(0, 8)}</span>
            </div>
          </div>
        )}

        {/* Fallback for legacy single-QR orders */}
        {!order.qr_code_tea && !order.qr_code_snacks && order.qr_code && (
          <div className="sm:col-span-2 flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-700">Scan at Counter</h3>
            <div className="p-2 border-2 border-dashed border-gray-300 rounded-lg">
              <img src={`data:image/png;base64,${order.qr_code}`} alt="Order QR Code" className="w-44 h-44" />
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-full font-mono font-bold text-gray-800 text-xs">
              #{order.id}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/')}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition"
      >
        Back to Home
      </button>
    </motion.div>
  );
};

export default OrderStatus;
