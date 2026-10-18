import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, CheckCircle2, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000/api'; 

const Checkout = ({ cartItems, totalAmount, userId, onBackToMenu }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const orderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, user_id: userId })
      });
      const orderData = await orderResponse.json();

      const options = {
        key: 'rzp_test_TgA2wiiP87W7Hf', 
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Snapit Canteen',
        description: 'Wallet Top-up & Food Order',
        order_id: orderData.order_id,
        handler: async function (response) {
          const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: userId,
              amount: totalAmount
            })
          });
          const verifyData = await verifyResponse.json();
          
          if (verifyData.status === 'success') {
            setQrCodeData(verifyData.qr_code_base64);
            setPaymentSuccess(true);
          } else {
            alert('Payment verification failed!');
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@college.edu',
          contact: '9999999999'
        },
        theme: {
          color: '#ef4f5f' // Zomato Red
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        alert(`Payment Failed: ${response.error.description}`);
      });
      
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Something went wrong initiating payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 fixed inset-0 z-50"
      >
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-8 text-center">Show this QR code at the counter to collect your order instantly.</p>
        
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
          {qrCodeData ? (
            <img src={qrCodeData} alt="Order QR Code" className="w-48 h-48" />
          ) : (
             <QrCode className="w-48 h-48 text-gray-300" />
          )}
          <p className="mt-4 font-mono text-gray-600 font-semibold tracking-wider">ORDER READY</p>
        </div>
        
        <button 
          onClick={onBackToMenu}
          className="mt-12 bg-gray-900 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
        >
          Back to Menu
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col sm:max-w-md sm:mx-auto sm:shadow-2xl"
    >
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
         <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
         <button onClick={onBackToMenu} className="text-gray-500 font-medium">Cancel</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Your Order
          </h3>
          
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 border border-green-500 flex items-center justify-center rounded-sm">
                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 </div>
                 <span className="font-medium text-gray-800">{item.name}</span>
                 <span className="text-gray-400 text-sm">x{item.quantity}</span>
              </div>
              <span className="font-semibold text-gray-800">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-700 mb-3">Bill Details</h3>
           <div className="flex justify-between text-gray-600 mb-2">
             <span>Item Total</span>
             <span>₹{totalAmount}</span>
           </div>
           <div className="flex justify-between text-gray-600 mb-2">
             <span>Platform Fee</span>
             <span>₹0</span>
           </div>
           <hr className="my-3 border-gray-100" />
           <div className="flex justify-between font-bold text-gray-800 text-lg">
             <span>To Pay</span>
             <span>₹{totalAmount}</span>
           </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-8">
         <button 
           onClick={handlePayment}
           disabled={isProcessing}
           className="w-full bg-[#ef4f5f] hover:bg-[#d64554] text-white rounded-xl py-4 px-4 flex items-center justify-between transition-colors shadow-lg shadow-red-200"
         >
           <div className="flex flex-col items-start">
              <span className="text-xs text-red-100 uppercase tracking-wider font-semibold">Total</span>
              <span className="font-bold text-lg">₹{totalAmount}</span>
           </div>
           <div className="flex items-center gap-2 font-bold text-lg">
              {isProcessing ? 'Processing...' : 'Proceed to Pay'} 
              {!isProcessing && <ChevronRight className="w-5 h-5" />}
           </div>
         </button>
      </div>
    </motion.div>
  );
};

export default Checkout;
