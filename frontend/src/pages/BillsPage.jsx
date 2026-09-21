import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Download, ChevronDown, ChevronUp, QrCode,
  Coffee, Utensils, Search, Filter, CalendarDays, RefreshCw
} from 'lucide-react';

const CANTEEN_NAMES = { A: 'Main Canteen', B: 'Food Court', C: 'Snack Corner' };
const CANTEEN_EMOJIS = { A: '🍽️', B: '🍔', C: '☕' };

const STATUS_CONFIG = {
  PENDING:   { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500',  label: 'Pending'   },
  PREPARING: { color: 'bg-amber-100  text-amber-700  border-amber-200',  dot: 'bg-amber-500',   label: 'Preparing' },
  READY:     { color: 'bg-green-100  text-green-700  border-green-200',  dot: 'bg-green-500',   label: 'Ready ✓'   },
  SERVED:    { color: 'bg-gray-100   text-gray-600   border-gray-200',   dot: 'bg-gray-400',    label: 'Served'    },
};

const formatDate = (raw) => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return '—'; }
};

/* ─── Canvas helper ─────────────────────────────────────────────────────── */
function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

const loadImg = (src) =>
  new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });

/* ─── Download Bill ─────────────────────────────────────────────────────── */
const downloadBill = async (order) => {
  const W = 560;
  const PAD = 32;
  const items = order.items || [];
  const hasQR = order.qr_code_tea || order.qr_code_snacks || order.qr_code;
  const qrH = hasQR ? 230 : 0;
  const H = 380 + items.length * 28 + qrH + 60;

  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // — Background —
  ctx.fillStyle = '#fff8f2';
  ctx.fillRect(0, 0, W, H);

  // — Header band —
  const grad = ctx.createLinearGradient(0, 0, W, 80);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(1, '#fb923c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 80);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('SnapIt', PAD, 40);
  ctx.font = '13px sans-serif';
  ctx.fillText('Campus Food Receipt', PAD, 62);

  // Status chip (top-right)
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  fillRoundRect(ctx, W - 118, 22, 90, 28, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cfg.label, W - 73, 41);
  ctx.textAlign = 'left';

  let y = 104;

  // — Meta rows —
  const meta = [
    ['Order ID',  '#' + (order.id || '').slice(0, 8).toUpperCase()],
    ['Date',      formatDate(order.created_at)],
    ['Canteen',   CANTEEN_NAMES[order.canteen_id] || order.canteen_id || '—'],
    ['Student',   order.student_name || '—'],
  ];
  meta.forEach(([label, value]) => {
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(label, PAD, y);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(value, PAD + 108, y);
    y += 23;
  });

  y += 10;
  ctx.strokeStyle = '#fed7aa';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 16;

  // — Items —
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#f97316';
  ctx.fillText('ITEM', PAD, y);
  ctx.fillText('QTY', PAD + 270, y);
  ctx.textAlign = 'right';
  ctx.fillText('PRICE', W - PAD, y);
  ctx.textAlign = 'left';
  y += 8;

  ctx.strokeStyle = '#fde8d4';
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 16;

  items.forEach(item => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#374151';
    const name = item.item_name || item.name || '—';
    ctx.fillText(name.length > 28 ? name.slice(0, 28) + '…' : name, PAD, y);
    ctx.fillText('×' + item.quantity, PAD + 270, y);
    ctx.textAlign = 'right';
    ctx.fillText('₹' + (item.price * item.quantity).toFixed(2), W - PAD, y);
    ctx.textAlign = 'left';
    y += 28;
  });

  y += 8;
  ctx.strokeStyle = '#fed7aa';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 22;

  // — Total —
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText('TOTAL', PAD, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('₹' + (order.total_amount || 0).toFixed(2), W - PAD, y);
  ctx.textAlign = 'left';
  y += 36;

  // — QR codes —
  const drawQR = async (b64, label, xOff) => {
    const img = await loadImg('data:image/png;base64,' + b64);
    if (!img) return;
    ctx.fillStyle = '#fff';
    fillRoundRect(ctx, xOff, y, 190, 195, 10);
    ctx.drawImage(img, xOff + 25, y + 20, 140, 140);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText(label, xOff + 95, y + 180);
    ctx.textAlign = 'left';
  };

  const qrCodes = [];
  if (order.qr_code_tea && order.tea_status !== 'NONE')
    qrCodes.push({ b64: order.qr_code_tea, label: '🍵 Tea Counter' });
  if (order.qr_code_snacks && order.snacks_status !== 'NONE')
    qrCodes.push({ b64: order.qr_code_snacks, label: '🍔 Food Counter' });
  if (!order.qr_code_tea && !order.qr_code_snacks && order.qr_code)
    qrCodes.push({ b64: order.qr_code, label: '📲 Scan at Counter' });

  for (let i = 0; i < qrCodes.length; i++) {
    const xOff = PAD + i * 200;
    await drawQR(qrCodes[i].b64, qrCodes[i].label, xOff);
  }

  if (qrCodes.length) y += 210;

  // — Footer —
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#d1d5db';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for ordering with SnapIt • snapit.campus', W / 2, y + 16);

  const link = document.createElement('a');
  link.download = 'SnapIt-Bill-' + (order.id || 'order').slice(0, 8) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/* ─── QR Panel ────────────────────────────────────────────────────────────── */
const QRPanel = ({ order }) => {
  const hasQR = order.qr_code_tea || order.qr_code_snacks || order.qr_code;
  if (!hasQR) return null;

  return (
    <motion.div
      key="qr-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28 }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-orange-100">
        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1">
          <QrCode size={11} /> Your QR Codes
        </p>
        <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
          {order.qr_code_tea && order.tea_status !== 'NONE' && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50">
                <img src={`data:image/png;base64,${order.qr_code_tea}`} alt="Tea QR" className="w-28 h-28" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                <Coffee size={10} /> Tea Counter
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[order.tea_status]?.color || ''}`}>
                {order.tea_status}
              </span>
            </div>
          )}
          {order.qr_code_snacks && order.snacks_status !== 'NONE' && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50">
                <img src={`data:image/png;base64,${order.qr_code_snacks}`} alt="Snacks QR" className="w-28 h-28" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                <Utensils size={10} /> Food Counter
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[order.snacks_status]?.color || ''}`}>
                {order.snacks_status}
              </span>
            </div>
          )}
          {!order.qr_code_tea && !order.qr_code_snacks && order.qr_code && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50">
                <img src={`data:image/png;base64,${order.qr_code}`} alt="QR Code" className="w-28 h-28" />
              </div>
              <span className="text-[10px] font-bold text-gray-600">Scan at Counter</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Bill Card ────────────────────────────────────────────────────────────── */
const BillCard = ({ order, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const hasQR = order.qr_code_tea || order.qr_code_snacks || order.qr_code;
  const items = order.items || [];

  const handleDownload = async () => {
    setDownloading(true);
    await downloadBill(order);
    setTimeout(() => setDownloading(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-100 transition-all duration-200"
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shrink-0">
              {CANTEEN_EMOJIS[order.canteen_id] || '🍽️'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {CANTEEN_NAMES[order.canteen_id] || order.canteen_id}
              </p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                #{(order.id || '').slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <CalendarDays size={10} /> {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-lg font-bold text-gray-900">
              ₹{(order.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Items list */}
        <div className="mt-4 space-y-1.5">
          {items.slice(0, expanded ? undefined : 3).map((item, i) => (
            <div key={i} className="flex items-center text-xs text-gray-600 gap-2">
              <span className="flex-1 truncate">{item.item_name || item.name || '—'}</span>
              <span className="shrink-0 text-gray-400">×{item.quantity}</span>
              <span className="shrink-0 font-semibold text-gray-700 w-16 text-right">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          {!expanded && items.length > 3 && (
            <p className="text-[11px] text-orange-400 font-medium">
              +{items.length - 3} more item(s)
            </p>
          )}
        </div>

        {/* QR Panel (animated) */}
        <AnimatePresence>
          {expanded && <QRPanel order={order} />}
        </AnimatePresence>

        {/* Action bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            id={`download-bill-${order.id}`}
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            {downloading
              ? <><RefreshCw size={12} className="animate-spin" /> Generating…</>
              : <><Download size={12} /> Download Bill</>
            }
          </button>

          <button
            id={`toggle-expand-${order.id}`}
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition"
          >
            {hasQR ? <QrCode size={12} /> : null}
            {expanded
              ? <><ChevronUp size={12} /> {hasQR ? 'Hide QR' : 'Less'}</>
              : <><ChevronDown size={12} /> {hasQR ? 'View QR' : 'More items'}</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
const BillsPage = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.getStudentOrders(currentUser.id);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch bills:', err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch = !search.trim() || (
      (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (CANTEEN_NAMES[o.canteen_id] || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.items || []).some(i =>
        (i.item_name || i.name || '').toLowerCase().includes(search.toLowerCase())
      )
    );
    return matchStatus && matchSearch;
  });

  const totalSpent = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading your bills…</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-orange-500" size={24} /> My Bills
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Your complete order history — view QR codes &amp; download receipts anytime
          </p>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 shrink-0">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wide">Orders</p>
            <p className="text-xl font-bold text-orange-600">{orders.length}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-center min-w-[96px]">
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wide">Spent</p>
            <p className="text-xl font-bold text-green-700">₹{totalSpent.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="bills-search"
            type="text"
            placeholder="Search by order ID, canteen, or item…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-gray-400 mr-1 shrink-0" />
          {['ALL', 'PENDING', 'PREPARING', 'READY', 'SERVED'].map(s => (
            <button
              key={s}
              id={`filter-${s.toLowerCase()}`}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                statusFilter === s
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
          <button
            id="refresh-bills"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition ml-1"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* List / Empty state */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 space-y-3"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-4xl">
            🧾
          </div>
          <h2 className="text-lg font-bold text-gray-700">No bills found</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            {orders.length === 0
              ? 'Place your first order to see your bill history here!'
              : 'No orders match your search or filter.'}
          </p>
          {orders.length > 0 && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="text-sm text-orange-500 font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <BillCard key={order.id} order={order} index={i} />
          ))}
          <p className="text-center text-[11px] text-gray-300 pt-1">
            Showing {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BillsPage;
