import { Capacitor } from '@capacitor/core';

// On Android Emulator, point to 10.0.2.2. In your desktop browser, keep localhost.
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

const BASE = `${API_BASE_URL}/api`;

export const api = {
  // Auth
  login: (data) => fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail);
    return r.json();
  }),
  addWallet: (userId, amount) => fetch(`${BASE}/auth/wallet/${userId}`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ amount })
  }).then(r => r.json()),

  // Canteens & Menu
  getCanteens: () => fetch(`${BASE}/canteens`).then(r => r.json()),
  getMenu: (canteenId) => fetch(`${BASE}/menu/${canteenId}`).then(r => r.json()),
  
  // Orders
  createOrder: (data) => fetch(`${BASE}/orders`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),
  getOrder: (id) => fetch(`${BASE}/orders/${id}`).then(r => r.json()),
  getPendingOrders: (canteenId) => fetch(`${BASE}/orders/pending/${canteenId}`).then(r => r.json()),
  updateOrderStatus: (id, status, type = 'all') => fetch(`${BASE}/orders/${id}/status?status=${status}&type=${type}`, {method: 'PUT'}).then(r => r.json()),
  
  // AI / Crowd
  getCrowdZones: (canteenId) => fetch(`${BASE}/ai/crowd-zones/${canteenId}`).then(r => r.json()),
  getRecommendations: () => fetch(`${BASE}/ai/recommendations`).then(r => r.json()),
  getAllCrowdData: () => fetch(`${BASE}/ai/all-canteens-crowd`).then(r => r.json()),
  refreshCrowd: () => fetch(`${BASE}/ai/refresh`, {method: 'POST'}).then(r => r.json()),
  
  // Analytics
  getSummary: () => fetch(`${BASE}/analytics/summary`).then(r => r.json()),
  getPeakHours: () => fetch(`${BASE}/analytics/peak-hours`).then(r => r.json()),
  getZoneComparison: () => fetch(`${BASE}/analytics/zone-comparison`).then(r => r.json()),
};
