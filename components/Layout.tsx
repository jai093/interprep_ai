

import React, { useState } from 'react';
// FIX: Add 'Outlet' import from react-router-dom v6.
// FIX: Use named import for react-router-dom v6.
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

// FIX: Updated Layout to use Outlet for react-router-dom v6 nested routing.
const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          {/* FIX: Use Outlet component for nested routing. */}
          <Outlet />
        </main>
      </div>
       {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;