import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// Skeleton loader for table rows
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </td>
    ))}
  </tr>
);

// Skeleton loader for table
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 6,
  showHeader = true 
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {showHeader && (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRowSkeleton key={rowIndex} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Card skeleton loader
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

// Stats grid skeleton
export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

// Modal content skeleton
export const ModalSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Inline loading spinner
export const InlineLoader: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ 
  loading, 
  children, 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary'
}) => {
  const baseClasses = 'flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && <InlineLoader size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

// Page loading overlay
export const PageLoadingOverlay: React.FC<{ 
  message?: string;
  transparent?: boolean;
}> = ({ 
  message = 'Loading...', 
  transparent = false 
}) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${
    transparent ? 'bg-white bg-opacity-75' : 'bg-gray-50'
  }`}>
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// Refresh button with loading state
export const RefreshButton: React.FC<{
  onRefresh: () => void;
  loading: boolean;
  className?: string;
}> = ({ onRefresh, loading, className = '' }) => (
  <button
    onClick={onRefresh}
    disabled={loading}
    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
  </button>
);

// Empty state with action
export const EmptyStateWithAction: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}> = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  loading = false 
}) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    {actionLabel && onAction && (
      <LoadingButton
        loading={loading}
        onClick={onAction}
        variant="primary"
      >
        {actionLabel}
      </LoadingButton>
    )}
  </div>
);

// Progress indicator
export const ProgressIndicator: React.FC<{
  current: number;
  total: number;
  label?: string;
  className?: string;
  showPercentage?: boolean;
  color?: 'red' | 'blue' | 'green' | 'yellow';
}> = ({ 
  current, 
  total, 
  label, 
  className = '', 
  showPercentage = true,
  color = 'red'
}) => {
  const percentage = Math.round((current / total) * 100);
  
  const colorClasses = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label || 'Progress'}</span>
          <span>
            {showPercentage ? `${percentage}%` : `${current} of ${total}`}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Loading state for specific sections
export const SectionLoader: React.FC<{
  title?: string;
  height?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
}> = ({ 
  title = 'Loading...', 
  height = 'h-32',
  className = '',
  variant = 'default'
}) => {
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${height} ${className}`}>
        <InlineLoader size="md" className="text-gray-400" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${height} flex items-center justify-center ${className}`}>
        <div className="text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-500">This may take a few moments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${height} flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

// Enhanced table loading with skeleton rows
export const EnhancedTableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  showPagination?: boolean;
}> = ({ 
  rows = 5, 
  columns = 6,
  showHeader = true,
  showActions = true,
  showPagination = true
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {showHeader && (
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </th>
            ))}
            {showActions && (
              <th className="px-6 py-3">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="animate-pulse">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </td>
              ))}
              {showActions && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {showPagination && (
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )}
  </div>
);

// Smart loading component that adapts based on content type
export const SmartLoader: React.FC<{
  type: 'table' | 'cards' | 'form' | 'chart' | 'list';
  count?: number;
  className?: string;
}> = ({ type, count = 5, className = '' }) => {
  switch (type) {
    case 'table':
      return <EnhancedTableSkeleton rows={count} />;
    case 'cards':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {Array.from({ length: count }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      );
    case 'form':
      return <ModalSkeleton />;
    case 'chart':
      return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    case 'list':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return <SectionLoader className={className} />;
  }
};