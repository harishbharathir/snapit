import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ZoneHeatmap from '../components/ZoneHeatmap';
import CartDrawer from '../components/CartDrawer';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'South Indian', 'North Indian', 'Chinese', 'Snacks', 'Beverages'];

const MenuPage = ({ currentUser, onUpdateUser }) => {
  const { canteenId } = useParams();
  const navigate = useNavigate();
  const [canteen, setCanteen] = useState(null);
  const [zones, setZones] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const canteens = await api.getCanteens();
        setCanteen(canteens.find(c => c.id === canteenId));
        const crowdData = await api.getCrowdZones(canteenId);
        setZones(crowdData.zones || []);
        setMenu(await api.getMenu(canteenId));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    
    fetchData();
    // Poll every 5s for realtime inventory and crowd updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [canteenId]);

  const addToCart = (item) => {
    if (item.inventory <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.inventory) return prev; // Cannot add more than inventory
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(cartItem => {
      if (cartItem.id === id) {
        const menuItem = menu.find(m => m.id === id);
        const newQ = cartItem.quantity + delta;
        
        if (newQ > (menuItem?.inventory || 0)) return cartItem;
        return newQ > 0 ? { ...cartItem, quantity: newQ } : null;
      }
      return cartItem;
    }).filter(Boolean));
  };

  const placeOrder = async (paymentMethod) => {
    if (cart.length === 0) return;
    
    try {
      const order = await api.createOrder({
        canteen_id: canteenId,
        student_id: currentUser.id,
        student_name: currentUser.username,
        payment_method: paymentMethod, // 'cash' or 'wallet'
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      });
      
      // If paid with wallet, immediately deduct locally for smooth UX
      if (paymentMethod === 'wallet') {
        const cartTotalSum = cart.reduce((acc, i) => acc + i.quantity * i.price, 0);
        onUpdateUser({ ...currentUser, wallet_balance: currentUser.wallet_balance - cartTotalSum });
      }
      
      navigate(`/order/${order.id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to place order');
    }
  };

  const cartTotalCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotalSum = cart.reduce((acc, i) => acc + i.quantity * i.price, 0);

  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{canteen?.name || `Canteen ${canteenId}`} Menu</h1>
        </div>
        
        <div className="max-w-md">
          <p className="text-sm font-medium text-gray-500 mb-2">Live Crowd Status:</p>
          <ZoneHeatmap zones={zones} />
        </div>
      </header>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map(item => {
          const inCart = cart.find(c => c.id === item.id);
          const outOfStock = item.inventory <= 0;
          
          return (
            <motion.div 
              key={item.id} 
              whileHover={{ y: -2 }}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between ${outOfStock ? 'opacity-60' : ''}`}
            >
              {/* Food Image Header */}
              <div className="relative h-40 w-full bg-gray-50 overflow-hidden">
                <img 
                  src={item.image_url || '/snapit_logo.png'} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                {item.is_special && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                    SPECIAL
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-extrabold px-2.5 py-0.5 rounded backdrop-blur-sm shadow">
                  ₹{item.price}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    <span className={`text-xs font-bold ${outOfStock ? 'text-red-500' : item.inventory < 10 ? 'text-amber-500' : 'text-green-500'}`}>
                      {outOfStock ? 'Out of Stock' : `${item.inventory} left`}
                    </span>
                  </div>
                </div>
                
                {inCart ? (
                  <div className="mt-2 flex items-center justify-between bg-orange-50 rounded-lg px-3 py-1.5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-white border text-orange-600 font-bold hover:bg-orange-100">-</button>
                    <span className="font-bold text-orange-700">{inCart.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} disabled={inCart.quantity >= item.inventory} className="w-8 h-8 rounded-full bg-white border text-orange-600 font-bold hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed">+</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item)}
                    disabled={outOfStock}
                    className="mt-2 w-full bg-gray-50 hover:bg-orange-50 text-gray-800 hover:text-orange-600 border hover:border-orange-200 font-bold text-xs py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {outOfStock ? 'Unavailable' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {cartTotalCount > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{cartTotalCount} items in cart</p>
              <p className="font-bold text-xl">Total: ₹{cartTotalSum}</p>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              View Cart
            </button>
          </div>
        </motion.div>
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        onPlaceOrder={placeOrder}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MenuPage;
