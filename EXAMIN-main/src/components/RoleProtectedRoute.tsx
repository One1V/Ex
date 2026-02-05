import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleProtectedRoute: React.FC<{ role: 'user' | 'admin' | 'guide'; children: React.ReactElement }>
  = ({ role, children }) => {
  const { role: myRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Checking authorization…
      </div>
    );
  }

  if (myRole !== role) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default RoleProtectedRoute;
