import React, { useState, useEffect, useCallback } from 'react';
import { Users, Briefcase, UserPlus, FileText, AlertCircle } from 'lucide-react';
import AdminStats from '../../components/admin/AdminStats';
import type { StatItem } from '../../components/admin/AdminStats';
import type { DashboardMetrics, ChartData, RecentActivity } from '../../types';
import { adminAnalyticsAPI } from '../../services/api';

import { useAdminErrorHandler } from '../../utils/adminErrorHandler';
import { useAdminNotifications } from '../../utils/adminNotifications';
import { RefreshButton } from '../../components/admin/AdminLoadingStates';

const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { handleError, handleAuthError } = useAdminErrorHandler();
  const { operations } = useAdminNotifications();

  // Auto-refresh interval (5 minutes)
  const REFRESH_INTERVAL = 5 * 60 * 1000;

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    const operation = async () => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all dashboard data in parallel
      const [metricsResponse, chartResponse, activityResponse] = await Promise.all([
        adminAnalyticsAPI.getMetrics(),
        adminAnalyticsAPI.getChartData('30d'),
        adminAnalyticsAPI.getRecentActivity(10)
      ]);

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      if (chartResponse.success) {
        setChartData(chartResponse.data);
      }

      if (activityResponse.success) {
        setRecentActivity(activityResponse.data);
      }

      if (isRefresh) {
        operations.data.refreshed('Dashboard data');
      }
    };

    try {
      await operation();
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError(err, { context: 'Loading dashboard data' });
      } else {
        const apiError = handleError(err, { 
          context: 'Loading dashboard data',
          showToast: !isRefresh // Only show toast for initial load, not refresh
        });
        setError(apiError.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleError, handleAuthError, operations]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Convert metrics to stat items
  const getStatItems = (): StatItem[] => {
    if (!metrics) return [];

    return [
      {
        id: 'total-users',
        label: 'Total Users',
        value: metrics.totalUsers,
        change: metrics.userGrowth,
        changeLabel: 'from last month',
        icon: Users,
        color: 'blue'
      },
      {
        id: 'active-jobs',
        label: 'Active Jobs',
        value: metrics.activeJobs,
        change: metrics.jobGrowth,
        changeLabel: 'from last month',
        icon: Briefcase,
        color: 'green'
      },
      {
        id: 'recent-registrations',
        label: 'Recent Registrations',
        value: metrics.recentRegistrations,
        changeLabel: 'last 30 days',
        icon: UserPlus,
        color: 'purple'
      },
      {
        id: 'total-applications',
        label: 'Total Applications',
        value: metrics.totalApplications,
        change: metrics.applicationGrowth,
        changeLabel: 'from last month',
        icon: FileText,
        color: 'yellow'
      }
    ];
  };

  // Format activity type for display
  const formatActivityType = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'user_registered':
        return 'User Registration';
      case 'job_posted':
        return 'Job Posted';
      case 'application_submitted':
        return 'Application Submitted';
      default:
        return 'Unknown Activity';
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your platform's key metrics and activity</p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={refreshing}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <AdminStats
        stats={getStatItems()}
        loading={loading}
        error={error}
        columns={4}
      />

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h3>
            {loading ? (
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : chartData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-sm mb-2">Charts will be implemented in task 4.3</div>
                  <div className="text-xs text-gray-400">
                    User Registrations: {chartData.userRegistrations.length} data points<br />
                    Job Postings: {chartData.jobPostings.length} data points<br />
                    User Roles: {chartData.userRoles.length} categories
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No chart data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.type === 'user_registered' && <Users className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'job_posted' && <Briefcase className="w-4 h-4 text-green-600" />}
                    {activity.type === 'application_submitted' && <FileText className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatActivityType(activity.type)}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-xs text-gray-400 text-center">
        Data refreshes automatically every 5 minutes
      </div>
    </div>
  );
};

export default AdminOverview;