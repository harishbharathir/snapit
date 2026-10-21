import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Wallet, Banknote } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose, cart, updateQuantity, onPlaceOrder, currentUser }) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const [loading, setLoading] = useState(false);

  const handleOrder = async (method) => {
    setLoading(true);
    await onPlaceOrder(method);
    setLoading(false);
  };

  const hasEnoughBalance = (currentUser?.wallet_balance || 0) >= total;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">Your cart is empty</div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <div className="text-gray-500 text-sm">₹{item.price}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-gray-100 hover:bg-gray-200">
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-gray-100 hover:bg-gray-200">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="w-16 text-right font-medium text-sm">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between mb-6 font-bold text-lg">
                  <span>Total to Pay</span>
                  <span>₹{total}</span>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleOrder('wallet')}
                    disabled={loading || !hasEnoughBalance}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    <Wallet size={18} />
                    {hasEnoughBalance ? `Pay with Valet Card (Bal: ₹${currentUser?.wallet_balance})` : 'Insufficient Wallet Balance'}
                  </button>
                  
                  <button
                    onClick={() => handleOrder('cash')}
                    disabled={loading}
                    className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    <Banknote size={18} />
                    Pay using UPI
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
