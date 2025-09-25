import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config/environment';
import { User, LogOut, Briefcase, Plus } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">{config.appName}</span>
                {config.enableDebug && (
                  <span className="text-xs text-gray-500 capitalize">({config.environment})</span>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/jobs" className="text-gray-700 hover:text-blue-600 font-medium">
              Jobs
            </Link>
            {user?.role === 'employer' && (
              <Link to="/jobs/create" className="text-gray-700 hover:text-blue-600 font-medium">
                Post Job
              </Link>
            )}
            {user && (
              <Link to="/applications" className="text-gray-700 hover:text-blue-600 font-medium">
                {user.role === 'employer' ? 'Applications' : 'My Applications'}
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'employer' && (
                  <Link
                    to="/jobs/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Job
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - you can enhance this later */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/jobs"
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
          >
            Jobs
          </Link>
          {user?.role === 'employer' && (
            <Link
              to="/jobs/create"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
            >
              Post Job
            </Link>
          )}
          {user && (
            <Link
              to="/applications"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
            >
              {user.role === 'employer' ? 'Applications' : 'My Applications'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;