import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Bell, FileText, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { releaseNotesAPI } from '../services/api';

interface Notification {
  id: string;
  type: 'trial' | 'info' | 'release';
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

interface ReleaseNote {
  id: number;
  version: string;
  releaseDate: string;
  features: string[];
  isPublished: boolean;
  createdAt: string;
}

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [loadingReleaseNotes, setLoadingReleaseNotes] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const releaseNotesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Calculate days remaining
    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Load notifications from localStorage
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed.map((n: Notification) => ({
        ...n,
        date: new Date(n.date)
      })));
    } else {
      // Initialize with trial notification if trial is active
      if (diffDays > 0) {
        const trialNotification: Notification = {
          id: 'trial-notification',
          type: 'trial',
          title: 'Free Trial Active',
          message: `Your free trial has ${diffDays} day${diffDays === 1 ? '' : 's'} remaining. Enjoy full access to all features!`,
          date: new Date(),
          read: false
        };
        setNotifications([trialNotification]);
        localStorage.setItem('notifications', JSON.stringify([trialNotification]));
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch release notes on mount
    const fetchReleaseNotes = async () => {
      setLoadingReleaseNotes(true);
      try {
        const response = await releaseNotesAPI.getReleaseNotes();
        if (response.success && response.data) {
          setReleaseNotes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch release notes:', error);
      } finally {
        setLoadingReleaseNotes(false);
      }
    };

    fetchReleaseNotes();
  }, []);

  useEffect(() => {
    // Close dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (releaseNotesRef.current && !releaseNotesRef.current.contains(event.target as Node)) {
        setShowReleaseNotes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, candidates, or resources..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </form>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Release Notes */}
            <div className="relative" ref={releaseNotesRef}>
              <button
                onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Release Notes"
              >
                <FileText className="h-5 w-5" />
              </button>

              {showReleaseNotes && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Release Notes</h3>
                    <button
                      onClick={() => setShowReleaseNotes(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingReleaseNotes ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Loading release notes...
                      </div>
                    ) : releaseNotes.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No release notes available
                      </div>
                    ) : (
                      releaseNotes.map((release) => (
                        <div key={release.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-600">v{release.version}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(release.releaseDate).toLocaleDateString()}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {release.features.map((feature, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                            notification.read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center">
                              {notification.type === 'trial' && (
                                <Clock className="h-4 w-4 text-orange-500 mr-2" />
                              )}
                              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                            </div>
                            {!notification.read && (
                              <span className="flex h-2 w-2 rounded-full bg-blue-600 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.date.toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {user?.name}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
