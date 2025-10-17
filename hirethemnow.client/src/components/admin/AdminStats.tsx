import React from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: number; // percentage change
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  loading?: boolean;
  error?: string;
}

export interface AdminStatsProps {
  stats: StatItem[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const AdminStats: React.FC<AdminStatsProps> = ({
  stats,
  loading = false,
  error = null,
  className = '',
  columns = 4
}) => {
  const getColorClasses = (color: string = 'blue') => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          accent: 'border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          icon: 'text-green-600',
          accent: 'border-green-200'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          accent: 'border-yellow-200'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          icon: 'text-red-600',
          accent: 'border-red-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          icon: 'text-purple-600',
          accent: 'border-purple-200'
        };
      case 'gray':
        return {
          bg: 'bg-gray-50',
          icon: 'text-gray-600',
          accent: 'border-gray-200'
        };
      default:
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          accent: 'border-blue-200'
        };
    }
  };

  const getGridClasses = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (change?: number) => {
    if (change === undefined || change === 0) {
      return 'text-gray-600';
    }
    if (change > 0) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  const formatChange = (change?: number) => {
    if (change === undefined) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Stats</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`grid gap-6 ${getGridClasses()} ${className}`}>
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${getGridClasses()} ${className}`}>
      {stats.map((stat) => {
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <div
            key={stat.id}
            className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${colorClasses.accent}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Label */}
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                
                {/* Value */}
                <div className="flex items-baseline space-x-2">
                  {stat.loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : stat.error ? (
                    <span className="text-sm text-red-600">Error</span>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof stat.value === 'number' 
                        ? stat.value.toLocaleString() 
                        : stat.value
                      }
                    </p>
                  )}
                </div>
                
                {/* Change indicator */}
                {!stat.loading && !stat.error && stat.change !== undefined && (
                  <div className="flex items-center space-x-1 mt-2">
                    {getTrendIcon(stat.change)}
                    <span className={`text-sm font-medium ${getTrendColor(stat.change)}`}>
                      {formatChange(stat.change)}
                    </span>
                    {stat.changeLabel && (
                      <span className="text-sm text-gray-500">
                        {stat.changeLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Icon */}
              {stat.icon && (
                <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${colorClasses.icon}`} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;

// Convenience component for single stat card
export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  loading?: boolean;
  error?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = (props) => {
  const stat: StatItem = {
    id: 'single-stat',
    ...props
  };

  return (
    <AdminStats 
      stats={[stat]} 
      columns={1} 
      className={props.className}
    />
  );
};