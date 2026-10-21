import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import MenuPage from './pages/MenuPage';
import OrderStatus from './pages/OrderStatus';
import BillsPage from './pages/BillsPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        // Ensure user is student for this app
        if (user && user.role === 'student') {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
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
          <Route path="/" element={<StudentDashboard currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
          <Route path="/menu/:canteenId" element={<MenuPage currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
          <Route path="/order/:orderId" element={<OrderStatus />} />
          <Route path="/bills" element={<BillsPage currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
