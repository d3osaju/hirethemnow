import { toast } from 'react-hot-toast';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: string;
  id?: string;
}

/**
 * Centralized notification system for admin operations
 */
export class AdminNotifications {
  /**
   * Show success notification
   */
  static success(message: string, options: NotificationOptions = {}) {
    return toast.success(message, {
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: '500',
        ...options.style
      },
      className: options.className,
      icon: options.icon || '✅',
      id: options.id
    });
  }

  /**
   * Show error notification
   */
  static error(message: string, options: NotificationOptions = {}) {
    return toast.error(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: '500',
        ...options.style
      },
      className: options.className,
      icon: options.icon || '❌',
      id: options.id
    });
  }

  /**
   * Show warning notification
   */
  static warning(message: string, options: NotificationOptions = {}) {
    return toast(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        fontWeight: '500',
        ...options.style
      },
      className: options.className,
      icon: options.icon || '⚠️',
      id: options.id
    });
  }

  /**
   * Show info notification
   */
  static info(message: string, options: NotificationOptions = {}) {
    return toast(message, {
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: '500',
        ...options.style
      },
      className: options.className,
      icon: options.icon || 'ℹ️',
      id: options.id
    });
  }

  /**
   * Show loading notification
   */
  static loading(message: string, options: NotificationOptions = {}) {
    return toast.loading(message, {
      position: options.position || 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        fontWeight: '500',
        ...options.style
      },
      className: options.className,
      id: options.id
    });
  }

  /**
   * Update an existing notification
   */
  static update(toastId: string, message: string, type: 'success' | 'error' | 'loading' = 'success') {
    if (type === 'success') {
      toast.success(message, { id: toastId });
    } else if (type === 'error') {
      toast.error(message, { id: toastId });
    } else {
      toast.loading(message, { id: toastId });
    }
  }

  /**
   * Dismiss a specific notification
   */
  static dismiss(toastId?: string) {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all notifications
   */
  static dismissAll() {
    toast.dismiss();
  }

  /**
   * Show promise-based notification (loading -> success/error)
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options: NotificationOptions = {}
  ) {
    return toast.promise(promise, messages, {
      position: options.position || 'top-right',
      style: options.style,
      className: options.className,
      id: options.id
    });
  }
}

/**
 * Predefined notifications for common admin operations
 */
export const AdminOperationNotifications = {
  // User operations
  user: {
    created: (userName: string) => AdminNotifications.success(`User "${userName}" created successfully`),
    updated: (userName: string) => AdminNotifications.success(`User "${userName}" updated successfully`),
    deleted: (userName: string) => AdminNotifications.success(`User "${userName}" deleted successfully`),
    createError: (error?: string) => AdminNotifications.error(error || 'Failed to create user'),
    updateError: (error?: string) => AdminNotifications.error(error || 'Failed to update user'),
    deleteError: (error?: string) => AdminNotifications.error(error || 'Failed to delete user'),
    loading: (action: string) => AdminNotifications.loading(`${action} user...`)
  },

  // Job operations
  job: {
    created: (jobTitle: string) => AdminNotifications.success(`Job "${jobTitle}" created successfully`),
    updated: (jobTitle: string) => AdminNotifications.success(`Job "${jobTitle}" updated successfully`),
    deleted: (jobTitle: string) => AdminNotifications.success(`Job "${jobTitle}" deleted successfully`),
    published: (jobTitle: string) => AdminNotifications.success(`Job "${jobTitle}" published successfully`),
    unpublished: (jobTitle: string) => AdminNotifications.warning(`Job "${jobTitle}" unpublished`),
    createError: (error?: string) => AdminNotifications.error(error || 'Failed to create job'),
    updateError: (error?: string) => AdminNotifications.error(error || 'Failed to update job'),
    deleteError: (error?: string) => AdminNotifications.error(error || 'Failed to delete job'),
    loading: (action: string) => AdminNotifications.loading(`${action} job...`)
  },

  // Data operations
  data: {
    loaded: (dataType: string) => AdminNotifications.info(`${dataType} loaded successfully`),
    refreshed: (dataType: string) => AdminNotifications.info(`${dataType} refreshed`),
    exported: (dataType: string) => AdminNotifications.success(`${dataType} exported successfully`),
    imported: (dataType: string, count: number) => AdminNotifications.success(`Imported ${count} ${dataType} records`),
    loadError: (dataType: string) => AdminNotifications.error(`Failed to load ${dataType}`),
    exportError: (dataType: string) => AdminNotifications.error(`Failed to export ${dataType}`),
    importError: (dataType: string) => AdminNotifications.error(`Failed to import ${dataType}`),
    loading: (action: string, dataType: string) => AdminNotifications.loading(`${action} ${dataType}...`)
  },

  // Bulk operations
  bulk: {
    completed: (action: string, count: number, itemType: string) => 
      AdminNotifications.success(`${action} completed for ${count} ${itemType}`),
    partialSuccess: (successful: number, failed: number, itemType: string) =>
      AdminNotifications.warning(`${successful} ${itemType} processed successfully, ${failed} failed`),
    failed: (action: string, itemType: string) =>
      AdminNotifications.error(`Bulk ${action} failed for ${itemType}`),
    loading: (action: string, count: number, itemType: string) =>
      AdminNotifications.loading(`Processing ${action} for ${count} ${itemType}...`)
  },

  // System operations
  system: {
    saved: () => AdminNotifications.success('Settings saved successfully'),
    reset: () => AdminNotifications.info('Settings reset to default'),
    backup: () => AdminNotifications.success('Backup created successfully'),
    restore: () => AdminNotifications.success('Data restored successfully'),
    maintenance: (enabled: boolean) => 
      AdminNotifications.warning(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`),
    error: (operation: string) => AdminNotifications.error(`System ${operation} failed`),
    loading: (operation: string) => AdminNotifications.loading(`${operation}...`)
  },

  // Validation and form operations
  validation: {
    required: (fieldName: string) => AdminNotifications.error(`${fieldName} is required`),
    invalid: (fieldName: string) => AdminNotifications.error(`${fieldName} is invalid`),
    duplicate: (itemType: string) => AdminNotifications.error(`${itemType} already exists`),
    tooLong: (fieldName: string, maxLength: number) => 
      AdminNotifications.error(`${fieldName} must be less than ${maxLength} characters`),
    tooShort: (fieldName: string, minLength: number) => 
      AdminNotifications.error(`${fieldName} must be at least ${minLength} characters`),
    invalidFormat: (fieldName: string, format: string) => 
      AdminNotifications.error(`${fieldName} must be in ${format} format`)
  }
};

/**
 * Hook for using admin notifications in functional components
 */
export const useAdminNotifications = () => {
  return {
    success: AdminNotifications.success,
    error: AdminNotifications.error,
    warning: AdminNotifications.warning,
    info: AdminNotifications.info,
    loading: AdminNotifications.loading,
    update: AdminNotifications.update,
    dismiss: AdminNotifications.dismiss,
    dismissAll: AdminNotifications.dismissAll,
    promise: AdminNotifications.promise,
    operations: AdminOperationNotifications
  };
};

/**
 * Notification queue for batch operations
 */
export class NotificationQueue {
  private queue: Array<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; options?: NotificationOptions }> = [];
  private processing = false;

  add(type: 'success' | 'error' | 'warning' | 'info', message: string, options?: NotificationOptions) {
    this.queue.push({ type, message, options });
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        switch (notification.type) {
          case 'success':
            AdminNotifications.success(notification.message, notification.options);
            break;
          case 'error':
            AdminNotifications.error(notification.message, notification.options);
            break;
          case 'warning':
            AdminNotifications.warning(notification.message, notification.options);
            break;
          case 'info':
            AdminNotifications.info(notification.message, notification.options);
            break;
        }
        
        // Small delay between notifications to prevent overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    this.processing = false;
  }

  clear() {
    this.queue = [];
  }
}