import { toast } from 'react-hot-toast';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  showProgress?: boolean;
  fallbackAction?: () => void;
  context?: string;
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  action: () => Promise<void> | void;
  icon?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Enhanced error recovery system for admin operations
 */
export class AdminErrorRecovery {
  private static retryAttempts = new Map<string, number>();
  private static recoveryStrategies = new Map<string, RecoveryStrategy[]>();

  /**
   * Register recovery strategies for specific error types
   */
  static registerRecoveryStrategies(errorType: string, strategies: RecoveryStrategy[]) {
    this.recoveryStrategies.set(errorType, strategies);
  }

  /**
   * Get available recovery strategies for an error
   */
  static getRecoveryStrategies(error: any): RecoveryStrategy[] {
    const errorType = this.classifyError(error);
    return this.recoveryStrategies.get(errorType) || this.getDefaultStrategies();
  }

  /**
   * Classify error type for appropriate recovery strategies
   */
  private static classifyError(error: any): string {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return 'auth';
    }
    if (error?.response?.status >= 500) {
      return 'server';
    }
    if (error?.response?.status === 404) {
      return 'notfound';
    }
    if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return 'network';
    }
    if (error?.response?.status === 422 || error?.response?.status === 400) {
      return 'validation';
    }
    return 'unknown';
  }

  /**
   * Get default recovery strategies
   */
  private static getDefaultStrategies(): RecoveryStrategy[] {
    return [
      {
        name: 'Retry Operation',
        description: 'Try the operation again',
        action: () => window.location.reload(),
        icon: '🔄',
        severity: 'low'
      },
      {
        name: 'Refresh Page',
        description: 'Reload the current page',
        action: () => window.location.reload(),
        icon: '🔃',
        severity: 'medium'
      },
      {
        name: 'Go to Dashboard',
        description: 'Return to the admin dashboard',
        action: () => { window.location.href = '/admin/dashboard'; },
        icon: '🏠',
        severity: 'high'
      }
    ];
  }

  /**
   * Execute automatic recovery with retry logic
   */
  static async executeWithRecovery<T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
  ): Promise<T | null> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      showProgress = true,
      context = 'operation'
    } = options;

    const operationId = `${context}-${Date.now()}`;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (showProgress && attempt > 1) {
          toast.loading(`Retrying ${context}... (${attempt}/${maxRetries})`, {
            id: operationId
          });
        }

        const result = await operation();
        
        if (showProgress && attempt > 1) {
          toast.success(`${context} succeeded after ${attempt} attempts`, {
            id: operationId
          });
        }

        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;

      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          if (showProgress) {
            toast.error(`${context} failed after ${maxRetries} attempts`, {
              id: operationId
            });
          }
          break;
        }

        // Exponential backoff with jitter
        const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Store retry count for analysis
    this.retryAttempts.set(operationId, maxRetries);

    // Execute fallback action if provided
    if (options.fallbackAction) {
      try {
        options.fallbackAction();
      } catch (fallbackErr) {
        console.error('Fallback action failed:', fallbackErr);
      }
    }

    throw lastError;
  }

  /**
   * Smart retry with adaptive delay
   */
  static async smartRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T | null> {
    const previousAttempts = this.retryAttempts.get(context) || 0;
    const maxRetries = Math.min(3 + previousAttempts, 10); // Adaptive max retries
    const baseDelay = Math.min(1000 * (previousAttempts + 1), 5000); // Adaptive delay

    return this.executeWithRecovery(operation, {
      maxRetries,
      retryDelay: baseDelay,
      context,
      showProgress: true
    });
  }

  /**
   * Graceful degradation handler
   */
  static handleGracefulDegradation(
    error: any,
    fallbackData: any = null,
    context: string = 'operation'
  ) {
    console.warn(`Graceful degradation for ${context}:`, error);
    
    toast(`${context} is temporarily unavailable. Showing cached data.`, {
      duration: 4000,
      icon: '⚠️'
    });

    return fallbackData;
  }

  /**
   * Network-aware error handling
   */
  static handleNetworkError(_error: any, context: string = 'operation') {
    if (!navigator.onLine) {
      toast.error('You are offline. Please check your internet connection.', {
        duration: 0, // Keep until dismissed
        id: 'offline-error'
      });
      
      // Listen for online event
      const handleOnline = () => {
        toast.dismiss('offline-error');
        toast.success('Connection restored. You can try again now.');
        window.removeEventListener('online', handleOnline);
      };
      
      window.addEventListener('online', handleOnline);
      return;
    }

    // Network error while online
    toast.error(`Network error during ${context}. Please try again.`, {
      duration: 5000
    });
  }

  /**
   * User-friendly error messages
   */
  static getUserFriendlyMessage(error: any, context: string = 'operation'): string {
    const errorType = this.classifyError(error);
    
    const messages = {
      auth: 'Your session has expired. Please log in again.',
      server: 'Server is temporarily unavailable. Please try again later.',
      network: 'Network connection issue. Please check your internet connection.',
      notfound: 'The requested resource was not found.',
      validation: 'Please check your input and try again.',
      unknown: `An unexpected error occurred during ${context}. Please try again.`
    };

    return messages[errorType as keyof typeof messages] || messages.unknown;
  }

  /**
   * Error analytics and reporting
   */
  static reportErrorMetrics(error: any, context: string) {
    const errorData = {
      type: this.classifyError(error),
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryAttempts.get(context) || 0
    };

    // In a real application, send to analytics service
    console.log('Error Metrics:', errorData);
  }

  /**
   * Bulk operation error handling
   */
  static async handleBulkOperation<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
    options: {
      batchSize?: number;
      continueOnError?: boolean;
      showProgress?: boolean;
      context?: string;
    } = {}
  ) {
    const {
      batchSize = 10,
      continueOnError = true,
      showProgress = true,
      context = 'bulk operation'
    } = options;

    const results = {
      successful: [] as T[],
      failed: [] as { item: T; error: any }[],
      total: items.length
    };

    let toastId: string | undefined;
    
    if (showProgress) {
      toastId = toast.loading(`Processing ${context}... (0/${items.length})`);
    }

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            await operation(item);
            results.successful.push(item);
          } catch (error) {
            results.failed.push({ item, error });
            
            if (!continueOnError) {
              throw error;
            }
          }
        })
      );

      // Update progress
      if (showProgress && toastId) {
        const processed = results.successful.length + results.failed.length;
        toast.loading(`Processing ${context}... (${processed}/${items.length})`, {
          id: toastId
        });
      }
    }

    // Show final results
    if (showProgress && toastId) {
      if (results.failed.length === 0) {
        toast.success(`${context} completed successfully (${results.successful.length} items)`, {
          id: toastId
        });
      } else if (results.successful.length === 0) {
        toast.error(`${context} failed for all items`, {
          id: toastId
        });
      } else {
        toast(
          `${context} completed with ${results.successful.length} successful and ${results.failed.length} failed items`,
          { id: toastId, icon: '⚠️' }
        );
      }
    }

    return results;
  }
}

// Initialize default recovery strategies
AdminErrorRecovery.registerRecoveryStrategies('auth', [
  {
    name: 'Re-authenticate',
    description: 'Log in again to restore your session',
    action: () => { window.location.href = '/login'; },
    icon: '🔐',
    severity: 'high'
  },
  {
    name: 'Refresh Page',
    description: 'Reload the page to retry authentication',
    action: () => window.location.reload(),
    icon: '🔃',
    severity: 'medium'
  }
]);

AdminErrorRecovery.registerRecoveryStrategies('network', [
  {
    name: 'Check Connection',
    description: 'Verify your internet connection',
    action: () => {
      toast('Please check your internet connection and try again', {
        icon: 'ℹ️'
      });
    },
    icon: '🌐',
    severity: 'high'
  },
  {
    name: 'Retry Operation',
    description: 'Try the operation again',
    action: () => window.location.reload(),
    icon: '🔄',
    severity: 'medium'
  }
]);

AdminErrorRecovery.registerRecoveryStrategies('server', [
  {
    name: 'Try Again Later',
    description: 'Server may be temporarily unavailable',
    action: () => {
      toast('Server is temporarily unavailable. Please try again in a few minutes.', {
        icon: 'ℹ️'
      });
    },
    icon: '⏰',
    severity: 'medium'
  },
  {
    name: 'Go to Dashboard',
    description: 'Return to the main dashboard',
    action: () => { window.location.href = '/admin/dashboard'; },
    icon: '🏠',
    severity: 'low'
  }
]);