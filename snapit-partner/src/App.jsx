import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PartnerLayout from './components/PartnerLayout';
import PartnerLoginPage from './pages/PartnerLoginPage';
import CounterPage from './pages/CounterPage';
import KitchenPage from './pages/KitchenPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('partnerUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && ['staff', 'kitchen', 'admin'].includes(user.role)) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('partnerUser');
        }
      } catch {
        localStorage.removeItem('partnerUser');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('partnerUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <PartnerLoginPage onLogin={setCurrentUser} />;
  }

  // Determine home view according to primary role
  const getHomeElement = () => {
    if (currentUser.role === 'kitchen') return <KitchenPage currentUser={currentUser} />;
    if (currentUser.role === 'admin') return <AdminDashboard />;
    return <CounterPage currentUser={currentUser} />;
  };

  return (
    <Router>
      <PartnerLayout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={getHomeElement()} />

          {/* Staff Counter Routes */}
          {(currentUser.role === 'staff' || currentUser.role === 'admin') && (
            <Route path="/counter" element={<CounterPage currentUser={currentUser} />} />
          )}

          {/* Kitchen KDS Routes */}
          {(currentUser.role === 'kitchen' || currentUser.role === 'staff' || currentUser.role === 'admin') && (
            <Route path="/kitchen" element={<KitchenPage currentUser={currentUser} />} />
          )}

          {/* Admin Analytics Routes */}
          {currentUser.role === 'admin' && (
            <Route path="/admin" element={<AdminDashboard />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PartnerLayout>
    </Router>
  );
}

export default App;
