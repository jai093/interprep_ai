
import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, Briefcase, TrendingUp, BarChart, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import UnicornScene from "unicornstudio-react";

const LandingPage: React.FC = () => {
  const { theme, setTheme } = useAppContext();
  
  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Unicorn Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 overflow-hidden">
        <div className="absolute inset-0 scale-140 origin-top" style={{ transform: 'translateY(-100px)' }}> {/* Fixed background, further upward shift, and increased scale */}
            <UnicornScene
                projectId="gq62HLGFwgPXNuIv2zgt"
                width="100%"
                height="100%"
                scale={1}
                dpi={1.5}
                sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.5/dist/unicornStudio.umd.js"
            />
        </div>
        {/* Gradient Overlay to ensure text readability and fade out bottom edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md z-20 border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            InterPrepAI
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition">
              Log In
            </Link>
            <Link to="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-16">
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
          <h2 className="text-3xl font-bold text-center text-white">Features for Everyone</h2>
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            {/* For Candidates */}
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-white/10 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <User size={32} className="text-indigo-400" />
                <h3 className="text-2xl font-bold">For Candidates</h3>
              </div>
              <ul className="mt-6 space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Personalized Feedback:</strong> Get instant, detailed feedback on your interview answers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp size={20} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Career Roadmaps:</strong> AI-powered skill gap analysis and a custom plan to reach your career goals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart size={20} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Track Progress:</strong> Monitor your improvement over time with detailed analytics.</span>
                </li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-white/10 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <Briefcase size={32} className="text-indigo-400" />
                <h3 className="text-2xl font-bold">For Recruiters</h3>
              </div>
              <ul className="mt-6 space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Create Custom Assessments:</strong> Tailor AI-driven interviews for specific roles and skill levels.</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart size={20} className="text-green-400 mt-1 flex-shrink-0" />
                  <span><strong>Data-Driven Insights:</strong> Get objective, standardized reports on every candidate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp size={20} className="text-green-400 mt-1 flex-shrink-0" />
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