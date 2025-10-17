import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface AdminTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  error?: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  onSearch?: (searchTerm: string) => void;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  };
  className?: string;
}

function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search...",
  sortable = true,
  pagination,
  onSearch,
  onSort,
  emptyState,
  className = ""
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (onSearch) {
      const debounceTimer = setTimeout(() => {
        onSearch(searchTerm);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, onSearch]);

  const handleSort = (columnKey: string) => {
    if (!sortable || !onSort) return;

    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    onSort(columnKey, newSortOrder);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  };

  const getActionButtonClass = (variant: string = 'secondary') => {
    const baseClass = "p-1 rounded transition-colors";
    switch (variant) {
      case 'primary':
        return `${baseClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50`;
      case 'danger':
        return `${baseClass} text-red-600 hover:text-red-900 hover:bg-red-50`;
      default:
        return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
    }
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    
    const pages = [];
    const maxVisible = 5;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with search */}
      {searchable && (
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="text-center py-12">
              {emptyState?.icon && (
                <emptyState.icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {emptyState?.title || 'No data found'}
              </h3>
              <p className="text-gray-600">
                {emptyState?.description || 'No items to display.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                    >
                      {column.sortable && sortable ? (
                        <button
                          onClick={() => handleSort(String(column.key))}
                          className="flex items-center space-x-1 hover:text-gray-700 group"
                        >
                          <span>{column.label}</span>
                          <span className="group-hover:opacity-100">
                            {getSortIcon(String(column.key))}
                          </span>
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(item)
                          : String(item[column.key] || '')
                        }
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={action.className || getActionButtonClass(action.variant)}
                              title={action.label}
                            >
                              {action.icon && <action.icon className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !loading && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    page === pagination.currentPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTable;