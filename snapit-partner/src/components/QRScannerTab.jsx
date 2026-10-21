import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { CheckCircle, Camera, AlertCircle, Ticket, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

const QRScannerTab = ({ selectedCanteen, orders, onUpdateStatus }) => {
  const videoRef = useRef(null);
  const [scanData, setScanData] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [validatedType, setValidatedType] = useState('all');

  // Use refs for the scanning loop to avoid recreating the stream/useEffect
  const isScanningRef = useRef(isScanning);
  isScanningRef.current = isScanning;
  
  const ticketRef = useRef(ticket);
  ticketRef.current = ticket;

  // Initialize camera for crowd/scanner view and jsQR loop
  useEffect(() => {
    let stream = null;
    let animationFrameId = null;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const scanLoop = () => {
      if (
        isScanningRef.current && 
        !ticketRef.current &&
        videoRef.current && 
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code && code.data) {
          setScanData(code.data);
          setIsScanning(false); // Stop scanning immediately
          processScan(code.data);
        }
      }
      animationFrameId = requestAnimationFrame(scanLoop);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            animationFrameId = requestAnimationFrame(scanLoop);
          };
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const processScan = async (scannedString) => {
    setError('');
    setTicket(null);
    if (!scannedString || !scannedString.trim()) return;

    try {
      let orderId = '';
      let scanType = 'all';

      const parts = scannedString.trim().split(':');
      if (parts[0] === 'ORDER') {
        orderId = parts[1];
        if (parts.length >= 4) {
          scanType = parts[2].toLowerCase(); // 'tea' or 'snacks'
        }
      } else {
        orderId = scannedString.trim();
      }

      const order = await api.getOrder(orderId);
      
      if (order.detail) {
        throw new Error(order.detail); // Handle 404
      }
      
      if (order.canteen_id !== selectedCanteen) {
        throw new Error(`Invalid: Order belongs to Canteen ${order.canteen_id}`);
      }

      // Check if this specific part is already served
      if (scanType === 'tea' && order.tea_status === 'SERVED') {
        throw new Error("Invalid: Tea ticket has already been validated/served!");
      }
      if (scanType === 'snacks' && order.snacks_status === 'SERVED') {
        throw new Error("Invalid: Snacks/Food ticket has already been validated/served!");
      }
      if (scanType === 'all' && order.status === 'SERVED') {
        throw new Error("Invalid: Order has already been fully served!");
      }

      // Mark as SERVED and generate ticket
      await onUpdateStatus(order.id, 'SERVED', scanType);
      setValidatedType(scanType);
      setTicket(order);
      setScanData('');
      setIsScanning(false);
      
      // Reset scanner after 5 seconds automatically
      setTimeout(() => {
        setTicket(null);
        setIsScanning(true);
      }, 5000);

    } catch (err) {
      setError(err.message || "Invalid QR Code or Order ID");
      setIsScanning(false);
      // Give them a chance to read the error before re-enabling scan
      setTimeout(() => setIsScanning(true), 3000);
    }
  };

  const handleValidate = (e) => {
    e?.preventDefault();
    processScan(scanData);
  };

  // Hackathon demo helper: instantly load a valid pending order string
  const simulateScan = (type = 'all') => {
    if (orders && orders.length > 0) {
      const typeStr = type === 'all' ? '' : `:${type.toUpperCase()}`;
      const demoData = `ORDER:${orders[0].id}${typeStr}:${orders[0].student_name}`;
      setScanData(demoData);
      processScan(demoData);
    } else {
      setError("No pending orders available to simulate.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* LEFT: Live Camera Feed */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Camera size={20} className="text-orange-500" />
            Live Crowd & Scanner
          </h2>
          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span> LIVE
          </span>
        </div>
        
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* Scanner Overlay Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-orange-500 border-dashed rounded-xl relative">
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1 bg-orange-500 shadow-[0_0_10px_#f97316]"
                  animate={{ y: [0, 192, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Align QR code within the frame or enter details manually.
        </p>
      </div>

      {/* RIGHT: Validation & Ticket Generation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ScanLine size={20} className="text-orange-500" />
          Validate Purchase
        </h2>

        <form onSubmit={handleValidate} className="mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scan Result / Order ID</label>
            <input 
              type="text" 
              value={scanData}
              onChange={(e) => setScanData(e.target.value)}
              placeholder="e.g. ORDER:1234-abcd:Harish"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition"
            >
              Validate
            </button>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => simulateScan('tea')}
                className="flex-1 px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-xs transition border border-purple-200"
                title="Simulates scanning the Tea QR Code"
              >
                🍵 Demo Tea
              </button>
              <button 
                type="button"
                onClick={() => simulateScan('snacks')}
                className="flex-1 px-2 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-lg text-xs transition border border-orange-200"
                title="Simulates scanning the Snack QR Code"
              >
                🍔 Demo Snack
              </button>
              <button 
                type="button"
                onClick={() => simulateScan('all')}
                className="flex-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
                title="Simulates scanning overall order QR Code"
              >
                Demo All
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 mb-4">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success / Generated Ticket */}
        <AnimatePresence>
          {ticket && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mt-auto bg-green-50 border-2 border-dashed border-green-300 rounded-xl p-5 relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 opacity-10 text-green-600">
                <CheckCircle size={100} />
              </div>
              
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle size={20} />
                <h3 className="font-bold text-lg">
                  {validatedType === 'tea' ? 'Tea validated!' : validatedType === 'snacks' ? 'Snack validated!' : 'Purchase validated!'}
                </h3>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 relative z-10">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Ticket size={16}/> {validatedType === 'tea' ? 'TEA TICKET' : validatedType === 'snacks' ? 'SNACK TICKET' : 'DIGITAL TICKET'}
                  </span>
                  <span className="text-xs font-mono text-gray-500">#{ticket.id.slice(0,8).toUpperCase()}</span>
                </div>
                
                <p className="font-bold text-xl mb-1">{ticket.student_name}</p>
                <p className="text-xs text-gray-500 mb-3">{new Date().toLocaleString()}</p>
                
                <div className="space-y-1 mb-4">
                  {ticket.items
                    .filter(item => {
                      if (validatedType === 'tea') return item.category === 'Beverages';
                      if (validatedType === 'snacks') return item.category !== 'Beverages';
                      return true;
                    })
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}x {item.item_name || item.name}</span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  }
                </div>
                
                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Total Validated</span>
                  <span className="font-bold text-lg text-green-600">
                    ₹{ticket.items
                      .filter(item => {
                        if (validatedType === 'tea') return item.category === 'Beverages';
                        if (validatedType === 'snacks') return item.category !== 'Beverages';
                        return true;
                      })
                      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    }
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => { setTicket(null); setIsScanning(true); }}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
              >
                Scan Next Customer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!ticket && !error && (
          <div className="mt-auto flex flex-col items-center justify-center text-gray-400 py-8">
            <ScanLine size={48} className="mb-2 opacity-50" />
            <p className="text-sm">Awaiting QR scan...</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default QRScannerTab;
