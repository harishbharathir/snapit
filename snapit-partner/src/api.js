import { Capacitor } from '@capacitor/core';


const customServer = typeof window !== 'undefined' ? localStorage.getItem('snapit_server_url') : null;


export const API_BASE_URL = customServer || (
  Capacitor.isNativePlatform()
    ? 'https://snapit-backend-rd1v.onrender.com'
    : 'https://snapit-backend-rd1v.onrender.com'
);

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');


const BASE = `${API_BASE_URL}/api`;

export const api = {
  login: (data) => fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Login failed');
    return r.json();
  }),
  register: (data) => fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Registration failed');
    return r.json();
  }),
  signup: (data) => fetch(`${BASE}/auth/signup`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Signup failed');
    return r.json();
  }),
  addWallet: (userId, amount) => fetch(`${BASE}/auth/wallet/${userId}`, {

    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ amount })
  }).then(r => r.json()),


  getCanteens: () => fetch(`${BASE}/canteens`).then(r => r.json()),
  getMenu: (canteenId) => fetch(`${BASE}/menu/${canteenId}`).then(r => r.json()),
  
  createOrder: (data) => fetch(`${BASE}/orders`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(r => r.json()),
  getOrder: (id) => fetch(`${BASE}/orders/${id}`).then(r => r.json()),
  getStudentOrders: (studentId) => fetch(`${BASE}/orders/student/${studentId}`).then(r => r.json()),
  getPendingOrders: (canteenId) => fetch(`${BASE}/orders/pending/${canteenId}`).then(r => r.json()),
  updateOrderStatus: (id, status, type = 'all') => fetch(`${BASE}/orders/${id}/status?status=${status}&type=${type}`, {method: 'PUT'}).then(r => r.json()),
  

  getCrowdZones: (canteenId) => fetch(`${BASE}/ai/crowd-zones/${canteenId}`).then(r => r.json()),
  getRecommendations: () => fetch(`${BASE}/ai/recommendations`).then(r => r.json()),
  getAllCrowdData: () => fetch(`${BASE}/ai/all-canteens-crowd`).then(r => r.json()),
  refreshCrowd: () => fetch(`${BASE}/ai/refresh`, {method: 'POST'}).then(r => r.json()),
  
  
  getSummary: () => fetch(`${BASE}/analytics/summary`).then(r => r.json()),
  getPeakHours: () => fetch(`${BASE}/analytics/peak-hours`).then(r => r.json()),
  getZoneComparison: () => fetch(`${BASE}/analytics/zone-comparison`).then(r => r.json()),

  createMenuItem: (canteenId, formData) => fetch(`${BASE}/menu/${canteenId}`, {
    method: 'POST', body: formData
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to create item');
    return r.json();
  }),
  updateMenuItem: (canteenId, itemId, data) => fetch(`${BASE}/menu/${canteenId}/${itemId}`, {
    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to update item');
    return r.json();
  }),
  deleteMenuItem: (canteenId, itemId) => fetch(`${BASE}/menu/${canteenId}/${itemId}`, {
    method: 'DELETE'
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to delete item');
    return r.json();
  }),
  updateMenuItemImage: (canteenId, itemId, formData) => fetch(`${BASE}/menu/${canteenId}/${itemId}/image`, {
    method: 'PUT', body: formData
  }).then(r => r.json()),

  // Factory Kitchen Distributor API
  getKitchenRequests: (canteenId, status) => {
    let url = `${BASE}/kitchen/requests?`;
    if (canteenId && canteenId !== 'ALL') url += `canteen_id=${encodeURIComponent(canteenId)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    return fetch(url).then(r => r.json());
  },
  getKitchenBatchSummary: () => fetch(`${BASE}/kitchen/batch-summary`).then(r => r.json()),
  createKitchenRequest: (data) => fetch(`${BASE}/kitchen/requests`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to create request');
    return r.json();
  }),
  updateKitchenRequestStatus: (requestId, status, notes) => fetch(`${BASE}/kitchen/requests/${requestId}/status`, {
    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status, notes })
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to update status');
    return r.json();
  }),
  batchCookRequests: (requestIds, status) => fetch(`${BASE}/kitchen/requests/batch-cook`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ request_ids: requestIds, status })
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to batch cook');
    return r.json();
  }),
  restockFromKitchen: (requestId) => fetch(`${BASE}/kitchen/requests/${requestId}/restock`, {
    method: 'POST'
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).detail || 'Failed to restock');
    return r.json();
  }),
  getKitchenNotifications: (canteenId) => fetch(`${BASE}/kitchen/notifications/${canteenId}`).then(r => r.json()),
};

