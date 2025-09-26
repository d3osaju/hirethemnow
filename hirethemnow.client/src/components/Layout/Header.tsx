import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config/environment';
import { User, LogOut, Briefcase, Plus, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gradient-primary shadow-lg backdrop-blur-sm border-b border-primary-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Briefcase className="h-10 w-10 text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-secondary-300 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white drop-shadow-sm">{config.appName}</span>
                {config.enableDebug && (
                  <span className="text-xs text-primary-100 capitalize">({config.environment})</span>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/jobs" className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105 relative group">
              Jobs
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-secondary-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </Link>
            {user?.role === 'employer' && (
              <Link to="/jobs/create" className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105 relative group">
                Post Job
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-secondary-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
              </Link>
            )}
            {user && (
              <Link to="/applications" className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105 relative group">
                {user.role === 'employer' ? 'Applications' : 'My Applications'}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-secondary-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
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
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-primary-700 bg-white hover:bg-primary-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Post Job
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <div className="h-10 w-10 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-primary-700 bg-white hover:bg-primary-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="px-4 pt-4 pb-4 space-y-2">
          <Link
            to="/jobs"
            className="text-white/90 hover:text-white block px-4 py-3 text-base font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
          >
            Jobs
          </Link>
          {user?.role === 'employer' && (
            <Link
              to="/jobs/create"
              className="text-white/90 hover:text-white block px-4 py-3 text-base font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              Post Job
            </Link>
          )}
          {user && (
            <Link
              to="/applications"
              className="text-white/90 hover:text-white block px-4 py-3 text-base font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
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