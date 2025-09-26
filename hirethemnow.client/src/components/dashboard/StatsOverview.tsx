import React from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalApplications: number;
    pendingReplies: number;
    interviews: number;
    offers: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Applications Sent</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.totalApplications}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-gray-600">Pending Replies</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.pendingReplies}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-600">Interviews</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.interviews}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">Job Offers</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.offers}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">Response Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalApplications > 0
              ? Math.round(((stats.interviews + stats.offers) / stats.totalApplications) * 100)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;