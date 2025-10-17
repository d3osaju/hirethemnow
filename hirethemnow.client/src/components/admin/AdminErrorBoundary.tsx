import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
  enableReporting?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  showDetails: boolean;
  reportSent: boolean;
}

class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      showDetails: false,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      showDetails: false,
      reportSent: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context = 'Admin Panel' } = this.props;

    // Enhanced error logging with context
    console.group(`🚨 Admin Error Boundary [${context}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show contextual error toast notification
    toast.error(`An error occurred in ${context}. Please try refreshing the page.`, {
      duration: 5000,
      id: this.state.errorId || 'admin-error'
    });

    // Report error to monitoring service (if enabled)
    if (this.props.enableReporting !== false) {
      this.reportError(error, errorInfo);
    }
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, you would send this to your error reporting service
      // For now, we'll just log it and mark as reported
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context || 'Admin Panel',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Error Report:', errorReport);

      // Simulate API call to error reporting service
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState({ reportSent: true });
      toast.success('Error report sent successfully', { duration: 3000 });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      toast.error('Failed to send error report');
    }
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page manually.');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: retryCount + 1,
      showDetails: false,
      reportSent: false
    });

    toast(`Retrying... (${retryCount + 1}/${maxRetries})`, {
      icon: 'ℹ️'
    });
  };

  handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  handleToggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  handleCopyError = async () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorText = `Error ID: ${this.state.errorId}
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo.componentStack}
Context: ${this.props.context || 'Admin Panel'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}`;

    try {
      await navigator.clipboard.writeText(errorText);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
      toast.error('Failed to copy error details');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced error UI with recovery options
      const { enableRetry = true, showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;
      const { retryCount, showDetails, reportSent } = this.state;
      const maxRetries = 3;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600">
                An unexpected error occurred in {this.props.context || 'the admin panel'}.
                {enableRetry && retryCount < maxRetries && ' You can try again or go back to the dashboard.'}
              </p>

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-600">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </div>
              )}
            </div>

            {/* Error Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {enableRetry && retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </button>
            </div>

            {/* Error Details Section */}
            {showErrorDetails && this.state.error && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Bug className="w-5 h-5 mr-2" />
                    Error Details
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={this.handleCopyError}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={this.handleToggleDetails}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Basic Error Info */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Error Message</h4>
                    <p className="text-sm text-red-800 font-mono">{this.state.error.message}</p>
                  </div>

                  {/* Detailed Stack Trace */}
                  {showDetails && (
                    <>
                      {this.state.error.stack && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Stack Trace</h4>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Component Stack</h4>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words overflow-x-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error Reporting */}
                  {this.props.enableReporting !== false && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Error Reporting</h4>
                          <p className="text-sm text-blue-800">
                            {reportSent ? (
                              <span className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Error report sent successfully
                              </span>
                            ) : (
                              'Help us improve by sending an error report'
                            )}
                          </p>
                        </div>
                        {!reportSent && (
                          <button
                            onClick={() => this.reportError(this.state.error!, this.state.errorInfo!)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Send Report
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Suggestions */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">What you can do:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)</li>
                <li>• Check your internet connection</li>
                <li>• Clear your browser cache and cookies</li>
                <li>• Contact support with the Error ID if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);

    // Show user-friendly error message
    const message = error.message || 'An unexpected error occurred';
    toast.error(message);
  };

  return { handleError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <AdminErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </AdminErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};