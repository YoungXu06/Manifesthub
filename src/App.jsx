import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStore from './store';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UnifiedVisionBoard from './pages/UnifiedVisionBoard';
import VisionDetail from './pages/VisionDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';
import GlobalToastNotifications from './components/GlobalToastNotifications';

function App() {
  const { t } = useTranslation();
  const { user, authChecked, checkAuth, authLoading } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const location = useLocation();

  // App init: check auth state
  useEffect(() => {
    const initApp = async () => {
      await checkAuth();
      setIsInitializing(false);
    };
    
    initApp();
  }, [checkAuth]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // App loading
  if (isInitializing) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <>
      {/* Global Toast Notifications */}
      <GlobalToastNotifications />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            !user ? (
              <Login />
            ) : (
              // If logged in, redirect to intended page or dashboard
              <Navigate to={location.state?.from || "/dashboard"} replace />
            )
          } />
          <Route path="/register" element={
            !user ? (
              <Register /> 
            ) : (
              <Navigate to={location.state?.from || "/dashboard"} replace />
            )
          } />
        </Route>
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute user={user} authChecked={authChecked} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goals" element={<Navigate to="/visionboard" replace />} />
            <Route path="/visionboard" element={<UnifiedVisionBoard />} />
            <Route path="/visionboard/edit/:userId/:id" element={<VisionDetail editMode={true} />} />
            <Route path="/visionboard/:userId/:id" element={<VisionDetail />} />
            <Route path="/visionboard/edit/:id" element={<VisionDetail editMode={true} />} />
            <Route path="/visionboard/:id" element={<VisionDetail />} />
            <Route path="/visionboard-board" element={<Navigate to="/visionboard" replace />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
