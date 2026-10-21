import React from 'react';
import PartnerNavbar from './PartnerNavbar';

const PartnerLayout = ({ children, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PartnerNavbar currentUser={currentUser} onLogout={onLogout} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default PartnerLayout;
