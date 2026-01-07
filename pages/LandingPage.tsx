
import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, Briefcase, TrendingUp, BarChart, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LandingPage: React.FC = () => {
  const { theme, setTheme } = useAppContext();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-200 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            InterPrepAI
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
             <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Log In
            </Link>
            <Link to="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-16">
        <section className="container mx-auto px-6 text-center">
          <Bot size={64} className="mx-auto text-indigo-500 dark:text-indigo-400" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-100 mt-4 leading-tight">
            Your Personal AI Interview Coach
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mt-6 max-w-3xl mx-auto">
            Leverage AI to analyze your resume, generate personalized career roadmaps, and conduct mock interviews to land your dream job.
          </p>
          <div className="mt-10">
            <Link to="/signup" className="px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition shadow-lg">
              Get Started for Free
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 mt-24">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100">Features for Everyone</h2>
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            {/* For Candidates */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <User size={32} className="text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-2xl font-bold">For Candidates</h3>
              </div>
              <ul className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Personalized Feedback:</strong> Get instant, detailed feedback on your interview answers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Career Roadmaps:</strong> AI-powered skill gap analysis and a custom plan to reach your career goals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Track Progress:</strong> Monitor your improvement over time with detailed analytics.</span>
                </li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Briefcase size={32} className="text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-2xl font-bold">For Recruiters</h3>
              </div>
              <ul className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Create Custom Assessments:</strong> Tailor AI-driven interviews for specific roles and skill levels.</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Data-Driven Insights:</strong> Get objective, standardized reports on every candidate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp size={20} className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Streamline Hiring:</strong> Identify top candidates faster and reduce manual screening time.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} InterPrepAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;