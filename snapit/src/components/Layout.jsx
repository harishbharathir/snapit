import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { WS_BASE_URL } from '../api';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play a dual-chime notification sound
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.4);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
    gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
    osc2.start(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.55);
  } catch (e) {
    console.error("Audio Context failed to play notification sound", e);
  }
};

const Layout = ({ children, currentUser, onLogout, onUpdateUser }) => {
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;

    // Connect to WebSocket server directly
    const wsUrl = `${WS_BASE_URL}/api/ws/${currentUser.id}`;
    let socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_STATUS_UPDATE') {
          // Play chime sound
          playNotificationSound();
          
          // Display the toast notification
          setNotification(data);
          
          // Trigger a custom event so the OrderStatus page (if active) can refresh instantly
          const customEvent = new CustomEvent('orderStatusUpdate', { detail: data });
          window.dispatchEvent(customEvent);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    let reconnectTimer;
    socket.onclose = () => {
      reconnectTimer = setTimeout(() => {
        if (currentUser && currentUser.role === 'student') {
          // Reconnect logic: just rely on the effect hook dependency on reconnect
        }
      }, 5000);
    };

    return () => {
      socket.close();
      clearTimeout(reconnectTimer);
    };
  }, [currentUser]);

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const CANTEEN_NAMES = { A: 'Main Canteen', B: 'Food Court', C: 'Snack Corner' };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar currentUser={currentUser} onLogout={onLogout} onUpdateUser={onUpdateUser} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating Realtime Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden"
          >
            <div className="p-4 flex gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0 animate-bounce">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Order {notification.status === 'READY' ? 'Ready for Pickup! 🔔' : 'Status Update'}
                  </h3>
                  <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Your order from <span className="font-semibold text-gray-800">{CANTEEN_NAMES[notification.canteen_id] || notification.canteen_id}</span> is now <span className="font-bold text-orange-600">{notification.status}</span>.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      navigate(`/order/${notification.order_id}`);
                      setNotification(null);
                    }}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    View Status & QR Code
                  </button>
                  <button
                    onClick={() => setNotification(null)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            {/* Animated Progress Bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-1 bg-orange-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
