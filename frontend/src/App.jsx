import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import MenuPage from './pages/MenuPage';
import OrderStatus from './pages/OrderStatus';
import CounterPage from './pages/CounterPage';
import AdminDashboard from './pages/AdminDashboard';
import BillsPage from './pages/BillsPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <Router>
      <Layout currentUser={currentUser} onLogout={handleLogout} onUpdateUser={setCurrentUser}>
        <Routes>
          {/* Student Routes */}
          {currentUser.role === 'student' && (
            <>
              <Route path="/" element={<StudentDashboard currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
              <Route path="/menu/:canteenId" element={<MenuPage currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
              <Route path="/order/:orderId" element={<OrderStatus />} />
              <Route path="/bills" element={<BillsPage currentUser={currentUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}

          {/* Staff Routes */}
          {currentUser.role === 'staff' && (
            <>
              <Route path="/" element={<CounterPage currentUser={currentUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}

          {/* Admin Routes */}
          {currentUser.role === 'admin' && (
            <>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
