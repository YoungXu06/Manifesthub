import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../common/LoadingScreen';

const ProtectedRoute = ({ user, authChecked }) => {
  const location = useLocation();

  if (!authChecked) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="animate-fade-in">
      <Outlet />
    </div>
  );
};

export default ProtectedRoute;
