
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { LogOut, Menu, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, theme, setTheme } = useAppContext();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
       <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 flex justify-end items-center space-x-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="text-right">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;