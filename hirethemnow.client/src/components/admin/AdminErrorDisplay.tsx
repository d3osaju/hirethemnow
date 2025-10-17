import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  WifiOff,
  Server,
  Shield,
  Bug
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminErrorRecovery } from '../../utils/adminErrorRecovery';

export interface AdminErrorDisplayProps {
  error: any;
  context?: string;
  showRecoveryOptions?: boolean;
  showErrorDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const AdminErrorDisplay: React.FC<AdminErrorDisplayProps> = ({
  error,
  context = 'operation',
  showRecoveryOptions = true,
  showErrorDetails = false,
  onRetry,
  onDismiss,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const getErrorIcon = () => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return <Shield className="w-5 h-5 text-red-500" />;
    }
    if (error?.response?.status >= 500) {
      return <Server className="w-5 h-5 text-red-500" />;
    }
    if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return <WifiOff className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getErrorTitle = () => {
    if (error?.response?.status === 401) return 'Authentication Required';
    if (error?.response?.status === 403) return 'Access Denied';
    if (error?.response?.status >= 500) return 'Server Error';
    if (error?.code === 'NETWORK_ERROR') return 'Network Error';
    if (!navigator.onLine) return 'Offline';
    return 'Error Occurred';
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCopyError = async () => {
    const errorText = `Error: ${error?.message || 'Unknown error'}
Context: ${context}
Status: ${error?.response?.status || 'N/A'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
Stack: ${error?.stack || 'N/A'}`;

    try {
      await navigator.clipboard.writeText(errorText);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy error details');
    }
  };

  const recoveryStrategies = AdminErrorRecovery.getRecoveryStrategies(error);
  const userFriendlyMessage = AdminErrorRecovery.getUserFriendlyMessage(error, context);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      {/* Error Header */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-800">
              {getErrorTitle()}
            </h3>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
          
          <p className="mt-1 text-sm text-red-700">
            {userFriendlyMessage}
          </p>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            
            {showErrorDetails && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
              >
                <Bug className="w-3 h-3 mr-1" />
                Details
                {showDetails ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </button>
            )}
            
            <button
              onClick={handleCopyError}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Options */}
      {showRecoveryOptions && recoveryStrategies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <h4 className="text-xs font-medium text-red-800 mb-2">Recovery Options:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recoveryStrategies.map((strategy, index) => (
              <button
                key={index}
                onClick={strategy.action}
                className="flex items-center p-2 text-xs bg-white border border-red-200 rounded hover:bg-red-50 transition-colors text-left"
              >
                <span className="mr-2">{strategy.icon}</span>
                <div>
                  <div className="font-medium text-red-900">{strategy.name}</div>
                  <div className="text-red-700">{strategy.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Details */}
      {showErrorDetails && showDetails && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="space-y-3">
            {/* Basic Error Info */}
            <div>
              <h5 className="text-xs font-medium text-red-800 mb-1">Error Message:</h5>
              <p className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded">
                {error?.message || 'Unknown error'}
              </p>
            </div>

            {/* HTTP Status */}
            {error?.response?.status && (
              <div>
                <h5 className="text-xs font-medium text-red-800 mb-1">HTTP Status:</h5>
                <p className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded">
                  {error.response.status} - {error.response.statusText}
                </p>
              </div>
            )}

            {/* Request Details */}
            {error?.config && (
              <div>
                <h5 className="text-xs font-medium text-red-800 mb-1">Request:</h5>
                <p className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded">
                  {error.config.method?.toUpperCase()} {error.config.url}
                </p>
              </div>
            )}

            {/* Stack Trace (Development Only) */}
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <div>
                <h5 className="text-xs font-medium text-red-800 mb-1">Stack Trace:</h5>
                <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminErrorDisplay;

// Inline error component for forms and smaller spaces
export const InlineErrorDisplay: React.FC<{
  error: any;
  context?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ error, context, onRetry, className = '' }) => {
  const userFriendlyMessage = AdminErrorRecovery.getUserFriendlyMessage(error, context);

  return (
    <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{userFriendlyMessage}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-800 underline text-xs"
        >
          Retry
        </button>
      )}
    </div>
  );
};

// Network status indicator
export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2 text-center text-sm">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You are offline. Some features may not be available.</span>
      </div>
    </div>
  );
};

// Error boundary fallback with enhanced recovery
export const ErrorBoundaryFallback: React.FC<{
  error: Error;
  resetError: () => void;
  context?: string;
}> = ({ error, resetError, context = 'component' }) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <AdminErrorDisplay
        error={error}
        context={context}
        showRecoveryOptions={true}
        showErrorDetails={process.env.NODE_ENV === 'development'}
        onRetry={resetError}
      />
    </div>
  );
};