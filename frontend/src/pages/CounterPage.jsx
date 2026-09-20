import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, API_BASE_URL } from '../api';
import OrderCard from '../components/OrderCard';
import BottleneckAlert from '../components/BottleneckAlert';
import QRScannerTab from '../components/QRScannerTab';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Radio, ListOrdered, QrCode, UtensilsCrossed,
  Plus, Trash2, Edit3, ToggleLeft, ToggleRight,
  Tag, Star, Zap, Package, Upload, X, Check,
  ChevronDown, AlertCircle, ImagePlus, Save, Loader2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  MENU MANAGEMENT TAB
// ─────────────────────────────────────────────────────────

const CATEGORIES = ['South Indian', 'Chinese', 'Snacks', 'Beverages', 'North Indian', 'Fast Food', 'Desserts', 'Specials'];

const TAG_CONFIG = [
  { key: 'today_special', label: "Today's Special", icon: Star,   color: 'orange' },
  { key: 'new_arrival',   label: 'New Arrival',      icon: Zap,    color: 'blue'   },
  { key: 'is_offer',      label: 'Offer / Deal',     icon: Tag,    color: 'green'  },
];

const EMPTY_FORM = {
  name: '', description: '', price: '', offer_price: '', category: 'Snacks',
  inventory: 50, is_special: false, today_special: false, new_arrival: false, is_offer: false,
};

// Tag pill component
const TagPill = ({ tag }) => {
  const t = TAG_CONFIG.find(t => t.key === tag);
  if (!t) return null;
  const Icon = t.icon;
  const colors = {
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    green:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[t.color]}`}>
      <Icon size={10} /> {t.label}
    </span>
  );
};

// Individual menu item card
const ItemCard = ({ item, onToggle, onDelete, onEdit, canteenId }) => {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const activeTags = TAG_CONFIG.map(t => t.key).filter(k => item[k]);

  const imgSrc = item.image_url?.startsWith('/uploads/')
    ? `${API_BASE_URL}${item.image_url}`
    : item.image_url || '/images/food_default.jpg';

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    setDeleting(true);
    try { await onDelete(item.id); }
    catch { setDeleting(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(item.id, !item.available); }
    finally { setToggling(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: deleting ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.name}
          onError={e => { e.target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=No+Image'; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Availability badge */}
        <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full shadow ${
          item.available ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
        }`}>
          {item.available ? 'Available' : 'Unavailable'}
        </div>
        {/* Actions on hover */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-blue-600 shadow hover:bg-blue-50 transition"
            title="Edit"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow hover:bg-red-50 transition disabled:opacity-50"
            title="Delete"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>

        {/* Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeTags.map(t => <TagPill key={t} tag={t} />)}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="font-bold text-orange-600">₹{item.price}</span>
          {item.is_offer && item.offer_price && (
            <span className="text-xs text-gray-400 line-through">₹{item.offer_price}</span>
          )}
          <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
            <Package size={11} /> {item.inventory}
          </span>
        </div>

        {/* Toggle availability */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition ${
            item.available
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {toggling ? (
            <Loader2 size={13} className="animate-spin" />
          ) : item.available ? (
            <><ToggleRight size={14} /> Mark Unavailable</>
          ) : (
            <><ToggleLeft size={14} /> Mark Available</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Add / Edit form modal
const MenuItemForm = ({ canteenId, editItem, onSuccess, onCancel }) => {
  const [form, setForm] = useState(editItem
    ? { ...EMPTY_FORM, ...editItem, price: editItem.price ?? '', offer_price: editItem.offer_price ?? '' }
    : EMPTY_FORM
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    editItem?.image_url?.startsWith('/uploads/')
      ? `${API_BASE_URL}${editItem.image_url}`
      : editItem?.image_url || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) { setError('Enter a valid price'); return; }

    setSaving(true); setError('');
    try {
      if (editItem) {
        // JSON update for existing item
        const payload = {
          ...form,
          price: Number(form.price),
          offer_price: form.offer_price ? Number(form.offer_price) : null,
          inventory: Number(form.inventory),
        };
        await api.updateMenuItem(canteenId, editItem.id, payload);
        // Upload new image separately if changed
        if (imageFile) {
          const fd = new FormData();
          fd.append('image', imageFile);
          await api.updateMenuItemImage(canteenId, editItem.id, fd);
        }
      } else {
        // Multipart POST for new item
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('description', form.description);
        fd.append('price', Number(form.price));
        fd.append('category', form.category);
        fd.append('inventory', Number(form.inventory));
        fd.append('is_special', form.is_special);
        fd.append('today_special', form.today_special);
        fd.append('new_arrival', form.new_arrival);
        fd.append('is_offer', form.is_offer);
        if (form.offer_price) fd.append('offer_price', Number(form.offer_price));
        if (imageFile) fd.append('image', imageFile);
        await api.createMenuItem(canteenId, fd);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {editItem ? '✏️ Edit Item' : '➕ Add New Item'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Food Photo</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImage(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer transition ${
                dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-gray-50 hover:bg-orange-50/50'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <div className="text-white text-center">
                      <ImagePlus size={24} className="mx-auto mb-1" />
                      <span className="text-xs font-semibold">Change Photo</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Drop image here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP supported</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleImage(e.target.files[0])} />
            </div>
          </div>

          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
              <input
                type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Masala Dosa"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <div className="relative">
                <select
                  value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none bg-white"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
              <input
                type="number" min="0" value={form.inventory} onChange={e => set('inventory', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Short description of the item..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number" min="0" step="0.5" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Original Price ₹ <span className="text-xs text-gray-400">(for offers)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number" min="0" step="0.5" value={form.offer_price} onChange={e => set('offer_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
            <div className="grid grid-cols-3 gap-2">
              {TAG_CONFIG.map(({ key, label, icon: Icon, color }) => {
                const active = form[key];
                const styles = {
                  orange: active ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300',
                  blue:   active ? 'bg-blue-500 text-white border-blue-500'   : 'border-gray-200 text-gray-600 hover:border-blue-300',
                  green:  active ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-300',
                };
                return (
                  <button
                    key={key} type="button"
                    onClick={() => set(key, !active)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 border-2 rounded-xl text-xs font-semibold transition ${styles[color]}`}
                  >
                    {active && <Check size={12} className="mb-0.5" />}
                    <Icon size={14} />
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main MenuManagementTab ───────────────────────────────
const MenuManagementTab = ({ canteenId, canteenName }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterTag, setFilterTag] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadItems = useCallback(async () => {
    if (!canteenId) return;
    try {
      const data = await api.getMenu(canteenId);
      setItems(data);
    } catch {}
    setLoading(false);
  }, [canteenId]);

  useEffect(() => { setLoading(true); loadItems(); }, [loadItems]);

  const handleDelete = async (itemId) => {
    await api.deleteMenuItem(canteenId, itemId);
    showToast('Item deleted');
    loadItems();
  };

  const handleToggle = async (itemId, available) => {
    await api.updateMenuItem(canteenId, itemId, { available });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, available } : i));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditItem(null);
    showToast(editItem ? 'Item updated!' : 'Item added to menu!');
    loadItems();
  };

  // Filter
  const displayed = filterTag === 'all'
    ? items
    : items.filter(item => item[filterTag]);

  const counts = {
    all: items.length,
    today_special: items.filter(i => i.today_special).length,
    new_arrival: items.filter(i => i.new_arrival).length,
    is_offer: items.filter(i => i.is_offer).length,
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <Check size={16} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border shadow-sm">
        <div>
          <h2 className="font-bold text-gray-800">Menu Management</h2>
          <p className="text-sm text-gray-500">{canteenName} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:from-orange-600 hover:to-orange-700 transition"
        >
          <Plus size={16} /> Add New Item
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Items' },
          { key: 'today_special', label: "Today's Special", icon: Star },
          { key: 'new_arrival', label: 'New Arrivals', icon: Zap },
          { key: 'is_offer', label: 'Offers', icon: Tag },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilterTag(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filterTag === key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white border text-gray-600 hover:border-orange-300'
            }`}
          >
            {Icon && <Icon size={13} />} {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filterTag === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Items grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <UtensilsCrossed size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No items found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filterTag === 'all' ? "Click 'Add New Item' to get started" : 'No items with this tag yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {displayed.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                canteenId={canteenId}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MenuItemForm
            canteenId={canteenId}
            editItem={editItem}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  COUNTER PAGE
// ─────────────────────────────────────────────────────────
const CounterPage = ({ currentUser }) => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(
    currentUser?.canteen_id || ''
  );
  const [orders, setOrders] = useState([]);
  const [crowdData, setCrowdData] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'scanner' | 'menu'

  useEffect(() => {
    api.getCanteens().then(data => {
      setCanteens(data);
      // If staff has an assigned canteen, lock to it; otherwise default to first
      if (!currentUser?.canteen_id && data.length > 0) {
        setSelectedCanteen(data[0].id);
      }
    });
  }, [currentUser]);

  const fetchData = async () => {
    if (!selectedCanteen) return;
    try {
      const [pendingOrders, zoneData] = await Promise.all([
        api.getPendingOrders(selectedCanteen),
        api.getCrowdZones(selectedCanteen)
      ]);
      setOrders(pendingOrders);
      setCrowdData(zoneData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedCanteen]);

  const handleUpdateStatus = async (orderId, newStatus, type = 'all') => {
    await api.updateOrderStatus(orderId, newStatus, type);
    fetchData();
  };

  const zones = crowdData?.zones || [];
  const bottleneckZone = zones.find(z => (z.occupancy_percentage || 0) > 70);
  const canteenName = canteens.find(c => c.id === selectedCanteen)?.name || selectedCanteen;

  const TABS = [
    { key: 'queue',   label: `Pending Orders (${orders.length})`, icon: ListOrdered },
    { key: 'scanner', label: 'Scanner & Crowd Cam',               icon: QrCode },
    { key: 'menu',    label: 'Menu Management',                    icon: UtensilsCrossed },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Counter Mode — {canteenName}</h1>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Radio size={12} /> ONLINE
          </span>
        </div>
        {/* Only show selector if not locked to a specific canteen */}
        {!currentUser?.canteen_id && (
          <select
            value={selectedCanteen}
            onChange={(e) => setSelectedCanteen(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm"
          >
            {canteens.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition text-sm ${
              activeTab === key
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QRScannerTab
              selectedCanteen={selectedCanteen}
              orders={orders}
              onUpdateStatus={handleUpdateStatus}
            />
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MenuManagementTab canteenId={selectedCanteen} canteenName={canteenName} />
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Zone Status */}
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Zone Alerts</h2>
              <div className="grid grid-cols-3 gap-3">
                {zones.map((z, i) => {
                  const occ = z.occupancy_percentage || 0;
                  let statusColor = 'text-green-600';
                  let statusIcon = '🟢';
                  let message = 'Clear — normal operations';
                  if (occ > 70) { statusColor = 'text-red-600'; statusIcon = '🔴'; message = `Busy — ${z.people_count} people`; }
                  else if (occ > 40) { statusColor = 'text-amber-600'; statusIcon = '🟡'; message = `Moderate — ${z.people_count} people`; }
                  return (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{statusIcon}</span>
                        <span className="font-semibold text-sm">{z.zone_name || z.zone_id}</span>
                      </div>
                      <p className={`text-xs ${statusColor}`}>{message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {bottleneckZone && (
              <BottleneckAlert
                zone={bottleneckZone}
                recommendation="Consider opening additional counter or redirecting students."
              />
            )}

            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                Pending Orders
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{orders.length}</span>
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 text-gray-500">
                  <p className="text-lg mb-1">🍳</p>
                  No pending orders at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {orders.map(order => (
                      <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CounterPage;
