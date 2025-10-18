import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import AdminErrorBoundary from '../../components/admin/AdminErrorBoundary';
import {
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3,
  Briefcase
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { 
      name: 'Dashboard Overview', 
      href: '/admin/dashboard', 
      icon: BarChart3, 
      current: location.pathname === '/admin/dashboard' || location.pathname === '/admin'
    },
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: Users, 
      current: location.pathname === '/admin/users'
    },
    { 
      name: 'Job Management', 
      href: '/admin/jobs', 
      icon: Briefcase, 
      current: location.pathname === '/admin/jobs'
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: Settings, 
      current: location.pathname === '/admin/settings' 
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-red-600" />
              <span className="text-lg font-bold text-gray-900">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      item.current
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-red-600 truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-neutral-200">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-red-100 text-red-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="px-6 py-6 border-t border-neutral-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-red-600 truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-semibold text-error-600 hover:bg-error-50 rounded-xl transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Navbar */}
        <Navbar />

        {/* Mobile menu button */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold text-gray-900">Admin</span>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;