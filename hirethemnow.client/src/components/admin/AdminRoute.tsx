import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, token } = useAuth();
  const location = useLocation();

  // Enhanced security: Check for token expiration
  useEffect(() => {
    if (token && user) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // If token is expired, redirect to login
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (error) {
        // Invalid token format, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  }, [token, user, location.pathname]);

  // Enhanced loading state with admin branding
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or no token
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Enhanced unauthorized access handling with replace to prevent back navigation
  if (user.role !== 'admin') {
    return <Navigate to="/401" replace />;
  }

  // Additional security check: Ensure user object has required admin properties
  if (!user.id || !user.email || !user.name) {
    console.warn('Admin user object is incomplete, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;