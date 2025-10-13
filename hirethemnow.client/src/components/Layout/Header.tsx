import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Plus } from 'lucide-react';
import Logo from '../Logo';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-lg border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Logo size="xlarge" linkTo="/" />

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user && (
              <Link
                to="/resume-analysis"
                className="text-gray-600 hover:text-gray-900 font-medium transition-all duration-300 hover:scale-105"
              >
                Resume Analysis
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
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center space-x-3 bg-neutral-100 rounded-xl px-4 py-2 border border-neutral-200 hover:bg-neutral-200 transition-all duration-300 cursor-pointer"
                    title="Go to Profile"
                  >
                    <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-jobpilot-navy">{user.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-neutral-500 hover:text-error-600 p-2 rounded-lg hover:bg-neutral-100 transition-all duration-300 group"
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
                  className="text-gray-600 hover:text-gray-900 font-medium transition-all duration-300 hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-800 hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};

export default Header;