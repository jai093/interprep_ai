

import React from 'react';
// FIX: Use named import for NavLink from react-router-dom.
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, Milestone, BotMessageSquare, Users, UserCircle, Settings, ClipboardList, BookText, Sparkles, GraduationCap } from 'lucide-react';
import type { UserRole } from '../types';

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  role: UserRole;
}

const navItems: NavItem[] = [
  { path: '/candidate/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, role: 'candidate' },
  { path: '/candidate/roadmap', name: 'Roadmap', icon: <Milestone size={20} />, role: 'candidate' },
  { path: '/candidate/interview', name: 'Interview', icon: <BotMessageSquare size={20} />, role: 'candidate' },
  { path: '/candidate/coach', name: 'AI Coach', icon: <Sparkles size={20} />, role: 'candidate' },
  { path: '/candidate/communication', name: 'Skills Training', icon: <GraduationCap size={20} />, role: 'candidate' },
  { path: '/candidate/notes', name: 'Notes', icon: <BookText size={20} />, role: 'candidate' },
  { path: '/candidate/profile', name: 'Profile', icon: <UserCircle size={20} />, role: 'candidate' },
  { path: '/recruiter/dashboard', name: 'Assessments', icon: <ClipboardList size={20} />, role: 'recruiter' },
  { path: '/recruiter/profile', name: 'Profile', icon: <UserCircle size={20} />, role: 'recruiter' },
  { path: '/recruiter/settings', name: 'Settings', icon: <Settings size={20} />, role: 'recruiter' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}


const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAppContext();
  const filteredNavItems = navItems.filter(item => item.role === user?.role);

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">InterPrepAI</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavItems.map(item => (
          // FIX: Updated NavLink for v6 compatibility, using a function in `className` and the `end` prop instead of `activeClassName` and `exact`.
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => setIsOpen(false)}
            className={({isActive}) => `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white ${isActive ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold" : ""}`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;