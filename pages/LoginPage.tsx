

import React, { useState } from 'react';
// FIX: Use named imports for react-router-dom components and hooks.
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, AlertTriangle, Sun, Moon } from 'lucide-react';
import Spinner from '../components/Spinner';

const LoginPage: React.FC = () => {
  const { login, isLoading, theme, setTheme } = useAppContext();
  // FIX: Use the useNavigate hook directly.
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const fromLocation = location.state?.from as { pathname: string; search: string; hash: string } | undefined;
      // For HashRouter, the intended path is in the hash. We must reconstruct
      // the path from it to ensure correct redirection after login.
      const redirectTo = fromLocation?.hash ? fromLocation.hash.substring(1) : '/';
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors z-10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-400">InterPrepAI</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2 text-md sm:text-lg">Welcome Back! Please log in to continue.</p>
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-center text-slate-800 dark:text-slate-200 mb-6">Log In</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-slate-200"
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <AlertTriangle size={16} className="mr-2" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-gray-600"
              >
                {isLoading ? <Spinner size="h-6 w-6" /> : <><LogIn className="mr-3" size={20}/> Log In</>}
              </button>
            </div>
          </form>
           <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            {/* FIX: Use the Link component directly. */}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;