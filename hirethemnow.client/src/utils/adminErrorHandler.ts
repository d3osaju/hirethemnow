import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  context?: string;
  fallbackMessage?: string;
}

/**
 * Centralized error handler for admin operations
 */
export class AdminErrorHandler {
  /**
   * Handle API errors with consistent messaging and logging
   */
  static handleApiError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): ApiError {
    const {
      showToast = true,
      toastMessage,
      logError = true,
      context = 'API call',
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    let apiError: ApiError;

    // Parse different error types
    if (error?.response) {
      // Axios error with response
      apiError = {
        message: error.response.data?.message || error.response.statusText || fallbackMessage,
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data
      };
    } else if (error?.message) {
      // Standard Error object
      apiError = {
        message: error.message,
        details: error
      };
    } else if (typeof error === 'string') {
      // String error
      apiError = {
        message: error
      };
    } else {
      // Unknown error type
      apiError = {
        message: fallbackMessage,
        details: error
      };
    }

    // Log error if enabled
    if (logError) {
      console.error(`Admin Error [${context}]:`, {
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
        originalError: error
      });
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = toastMessage || this.getUserFriendlyMessage(apiError);
      toast.error(message);
    }

    return apiError;
  }

  /**
   * Handle form validation errors
   */
  static handleValidationError(
    errors: Record<string, string[]>,
    options: ErrorHandlerOptions = {}
  ): void {
    const {
      showToast = true,
      logError = true,
      context = 'Form validation'
    } = options;

    if (logError) {
      console.warn(`Admin Validation Error [${context}]:`, errors);
    }

    if (showToast) {
      const firstError = Object.values(errors)[0]?.[0];
      if (firstError) {
        toast.error(firstError);
      } else {
        toast.error('Please check your input and try again');
      }
    }
  }

  /**
   * Handle network/connectivity errors
   */
  static handleNetworkError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): void {
    const {
      showToast = true,
      logError = true,
      context = 'Network request'
    } = options;

    if (logError) {
      console.error(`Admin Network Error [${context}]:`, error);
    }

    if (showToast) {
      if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        toast.error('Network connection lost. Please check your internet connection.');
      } else {
        toast.error('Unable to connect to the server. Please try again.');
      }
    }
  }

  /**
   * Handle permission/authorization errors
   */
  static handleAuthError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): void {
    const {
      showToast = true,
      logError = true,
      context = 'Authorization'
    } = options;

    if (logError) {
      console.warn(`Admin Auth Error [${context}]:`, error);
    }

    // Prevent multiple simultaneous auth error handling
    if (this.isHandlingAuthError) {
      return;
    }
    this.isHandlingAuthError = true;

    if (showToast) {
      const status = error?.response?.status;
      if (status === 401) {
        toast.error('Your session has expired. Please log in again.');
        // Redirect to login after a delay, but prevent multiple redirects
        this.scheduleAuthRedirect();
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
        // Reset flag for 403 errors since they don't redirect
        this.isHandlingAuthError = false;
      } else {
        toast.error('Authentication error. Please try logging in again.');
        this.scheduleAuthRedirect();
      }
    } else {
      // Reset flag if not showing toast
      this.isHandlingAuthError = false;
    }
  }

  private static isHandlingAuthError = false;
  private static authRedirectScheduled = false;

  /**
   * Schedule auth redirect with protection against multiple redirects
   */
  private static scheduleAuthRedirect(): void {
    if (this.authRedirectScheduled) {
      return;
    }
    
    this.authRedirectScheduled = true;
    
    setTimeout(() => {
      // Clear any ongoing requests or timers before redirect
      if (typeof window !== 'undefined') {
        // Cancel any pending fetch requests
        if ('AbortController' in window) {
          // This is a general cleanup - specific implementations should handle their own AbortControllers
        }
        
        // Clear storage if needed
        try {
          sessionStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        } catch (e) {
          // Ignore storage errors
        }
        
        window.location.href = '/login';
      }
    }, 2000);
  }

  /**
   * Convert technical error messages to user-friendly ones
   */
  private static getUserFriendlyMessage(error: ApiError): string {
    const { message, status } = error;

    // Handle common HTTP status codes
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case 422:
        return 'The provided data is invalid. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        break;
    }

    // Handle common error patterns
    if (message.toLowerCase().includes('network')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (message.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already exists')) {
      return 'This item already exists. Please use a different value.';
    }

    if (message.toLowerCase().includes('not found')) {
      return 'The requested item was not found.';
    }

    // Return original message if it's user-friendly, otherwise use fallback
    if (message.length < 100 && !message.includes('Error:') && !message.includes('Exception')) {
      return message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Reset auth error handling state (for testing or manual reset)
   */
  static resetAuthErrorState(): void {
    this.isHandlingAuthError = false;
    this.authRedirectScheduled = false;
  }

  /**
   * Create a retry function with exponential backoff
   */
  static createRetryHandler<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): () => Promise<T> {
    return async (): Promise<T> => {
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;

          if (attempt === maxRetries) {
            break;
          }

          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          console.warn(`Admin operation retry ${attempt}/${maxRetries} after ${delay}ms`);
        }
      }

      throw lastError;
    };
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleApiError(error, options);
      return null;
    }
  }
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Refresh the current page
   */
  refreshPage: () => {
    window.location.reload();
  },

  /**
   * Navigate to admin dashboard
   */
  goToDashboard: () => {
    window.location.href = '/admin/dashboard';
  },

  /**
   * Navigate back in history
   */
  goBack: () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/admin/dashboard';
    }
  },

  /**
   * Clear local storage and refresh
   */
  clearAndRefresh: () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }
};

/**
 * Hook for using error handler in functional components
 */
export const useAdminErrorHandler = () => {
  const handleError = (error: any, options?: ErrorHandlerOptions) => {
    return AdminErrorHandler.handleApiError(error, options);
  };

  const handleValidationError = (errors: Record<string, string[]>, options?: ErrorHandlerOptions) => {
    return AdminErrorHandler.handleValidationError(errors, options);
  };

  const handleNetworkError = (error: any, options?: ErrorHandlerOptions) => {
    return AdminErrorHandler.handleNetworkError(error, options);
  };

  const handleAuthError = (error: any, options?: ErrorHandlerOptions) => {
    return AdminErrorHandler.handleAuthError(error, options);
  };

  const withErrorHandling = <T>(operation: () => Promise<T>, options?: ErrorHandlerOptions) => {
    return AdminErrorHandler.withErrorHandling(operation, options);
  };

  const createRetryHandler = <T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number) => {
    return AdminErrorHandler.createRetryHandler(operation, maxRetries, baseDelay);
  };

  const resetAuthErrorState = () => {
    return AdminErrorHandler.resetAuthErrorState();
  };

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
    handleAuthError,
    withErrorHandling,
    createRetryHandler,
    resetAuthErrorState,
    recovery: ErrorRecovery
  };
};