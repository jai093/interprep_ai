

import React from 'react';
// FIX: Update react-router-dom imports for v6 compatibility.
// FIX: Use named imports for react-router-dom components and hooks.
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import CandidateRoadmapPage from './pages/CandidateRoadmapPage';
import CandidateInterviewPage from './pages/CandidateInterviewPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import RecruiterProfilePage from './pages/RecruiterProfilePage';
import RecruiterSettingsPage from './pages/RecruiterSettingsPage';
import RecruiterCreateAssessmentPage from './pages/RecruiterCreateAssessmentPage';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentCompletePage from './pages/AssessmentCompletePage';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import type { UserRole } from './types';
import RecruiterAssessmentReportPage from './pages/RecruiterAssessmentReportPage';
import LandingPage from './pages/LandingPage';
import CandidateNotesPage from './pages/CandidateNotesPage';
import CandidateCoachPage from './pages/CandidateCoachPage';
import CandidateCommunicationPage from './pages/CandidateCommunicationPage';
import AssessmentRunnerPage from './pages/AssessmentRunnerPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-200 h-screen font-sans">
        <RouterComponent />
      </div>
    </AppProvider>
  );
};

// FIX: Update PrivateRoute to be a route-rendering component for v6 compatibility.
const PrivateRoute: React.FC<{ role?: UserRole }> = ({ role }) => {
  const { user } = useAppContext();
  // FIX: Use the useLocation hook directly.
  const location = useLocation();

  if (!user) {
    // FIX: Use the Navigate component directly.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user.role !== role) {
    const homeRoute = user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard';
    // FIX: Use the Navigate component directly.
    return <Navigate to={homeRoute} state={{ from: location }} replace />;
  }
  return <Layout />;
};


const RouterComponent: React.FC = () => {
  const { user } = useAppContext();

  const dashboardPath = user
    ? (user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard')
    : '/'; // Fallback for redirect logic

  return (
    // FIX: Use HashRouter component directly.
    <HashRouter>
      {/* FIX: Use <Routes> instead of <Switch> and update Route syntax for v6 compatibility. */}
      {/* FIX: Use Routes, Route, and Navigate components directly. */}
      <Routes>
        {/* Root route: LandingPage for guests, redirect to dashboard for logged-in users */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to={dashboardPath} replace />} />

        {/* Auth routes: Unauthenticated users see the page. Authenticated users are redirected. */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={dashboardPath} replace />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to={dashboardPath} replace />} />

        {/* Public Assessment Routes */}
        <Route path="/assessment/:assessmentId" element={<AssessmentPage />} />
        <Route path="/assessment/complete" element={<AssessmentCompletePage />} />

        {/* FIX: Define nested routes inside a layout route for v6. */}
        <Route element={<PrivateRoute role="candidate" />}>
          <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
          <Route path="/candidate/roadmap" element={<CandidateRoadmapPage />} />
          <Route path="/candidate/interview" element={<CandidateInterviewPage />} />
          <Route path="/candidate/coach" element={<CandidateCoachPage />} />
          <Route path="/candidate/communication" element={<CandidateCommunicationPage />} />
          <Route path="/candidate/notes" element={<CandidateNotesPage />} />
          <Route path="/candidate/profile" element={<CandidateProfilePage />} />
          <Route path="/candidate/assessment-engine/:assessmentId" element={<AssessmentRunnerPage />} />
        </Route>

        <Route element={<PrivateRoute role="recruiter" />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
          <Route path="/recruiter/profile" element={<RecruiterProfilePage />} />
          <Route path="/recruiter/settings" element={<RecruiterSettingsPage />} />
          <Route path="/recruiter/assessments/new" element={<RecruiterCreateAssessmentPage />} />
          <Route path="/recruiter/report/:resultId" element={<RecruiterAssessmentReportPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}


export default App;