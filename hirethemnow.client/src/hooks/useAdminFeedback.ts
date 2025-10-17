import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface FeedbackState {
  loading: boolean;
  error: string | null;
  success: string | null;
  progress: number;
  operation: string | null;
}

export interface FeedbackOptions {
  showToast?: boolean;
  showProgress?: boolean;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  duration?: number;
}

/**
 * Enhanced hook for managing admin operation feedback
 */
export const useAdminFeedback = () => {
  const [state, setState] = useState<FeedbackState>({
    loading: false,
    error: null,
    success: null,
    progress: 0,
    operation: null
  });

  const toastIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: null,
      progress: 0,
      operation: null
    });
    
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const setLoading = useCallback((operation: string, options: FeedbackOptions = {}) => {
    const {
      showToast = true,
      showProgress = false,
      loadingMessage
    } = options;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: null,
      progress: 0,
      operation
    }));

    if (showToast) {
      const message = loadingMessage || `${operation}...`;
      toastIdRef.current = toast.loading(message);
    }

    if (showProgress) {
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) {
          progress = 90;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
        setState(prev => ({ ...prev, progress }));
      }, 500);
    }
  }, []);

  const setSuccess = useCallback((message?: string, options: FeedbackOptions = {}) => {
    const {
      showToast = true,
      duration = 3000
    } = options;

    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      success: message || `${prev.operation} completed successfully`,
      progress: 100
    }));

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (showToast) {
      const successMessage = message || `${state.operation} completed successfully`;
      if (toastIdRef.current) {
        toast.success(successMessage, { id: toastIdRef.current, duration });
      } else {
        toast.success(successMessage, { duration });
      }
    }

    // Auto-clear success state after duration
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        success: null,
        progress: 0,
        operation: null
      }));
    }, duration);
  }, [state.operation]);

  const setError = useCallback((error: string | Error, options: FeedbackOptions = {}) => {
    const {
      showToast = true,
      errorMessage,
      duration = 5000
    } = options;

    const message = errorMessage || (error instanceof Error ? error.message : error);

    setState(prev => ({
      ...prev,
      loading: false,
      success: null,
      error: message,
      progress: 0
    }));

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (showToast) {
      if (toastIdRef.current) {
        toast.error(message, { id: toastIdRef.current, duration });
      } else {
        toast.error(message, { duration });
      }
    }
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options: FeedbackOptions = {}
  ): Promise<T | null> => {
    try {
      setLoading(operationName, options);
      const result = await operation();
      setSuccess(options.successMessage, options);
      return result;
    } catch (error) {
      setError(error as Error, options);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  const executeBulkWithFeedback = useCallback(async <T>(
    items: T[],
    operation: (item: T, index: number) => Promise<void>,
    operationName: string,
    options: FeedbackOptions & { batchSize?: number; continueOnError?: boolean } = {}
  ) => {
    const {
      batchSize = 10,
      continueOnError = true,
      showToast = true
    } = options;

    const results = {
      successful: [] as T[],
      failed: [] as { item: T; error: any }[],
      total: items.length
    };

    setLoading(operationName, { ...options, showProgress: true });

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (item, batchIndex) => {
            try {
              await operation(item, i + batchIndex);
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
        const completed = results.successful.length + results.failed.length;
        updateProgress((completed / items.length) * 100);

        // Update toast message
        if (showToast && toastIdRef.current) {
          toast.loading(
            `${operationName}... (${completed}/${items.length})`,
            { id: toastIdRef.current }
          );
        }
      }

      // Show final results
      if (results.failed.length === 0) {
        setSuccess(`${operationName} completed successfully (${results.successful.length} items)`, options);
      } else if (results.successful.length === 0) {
        setError(`${operationName} failed for all items`, options);
      } else {
        const message = `${operationName} completed with ${results.successful.length} successful and ${results.failed.length} failed items`;
        if (showToast) {
          toast(message, { 
            id: toastIdRef.current || undefined,
            duration: 7000,
            icon: '⚠️'
          });
        }
        setState(prev => ({
          ...prev,
          loading: false,
          success: message,
          progress: 100
        }));
      }

      return results;
    } catch (error) {
      setError(error as Error, options);
      return results;
    }
  }, [setLoading, setSuccess, setError, updateProgress]);

  return {
    state,
    setLoading,
    setSuccess,
    setError,
    updateProgress,
    clearState,
    executeWithFeedback,
    executeBulkWithFeedback,
    
    // Convenience getters
    isLoading: state.loading,
    hasError: !!state.error,
    hasSuccess: !!state.success,
    progress: state.progress,
    operation: state.operation,
    error: state.error,
    success: state.success
  };
};

/**
 * Hook for managing form feedback specifically
 */
export const useFormFeedback = () => {
  const feedback = useAdminFeedback();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((field: string) => {
    return !!fieldErrors[field];
  }, [fieldErrors]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors[field];
  }, [fieldErrors]);

  const validateAndSubmit = useCallback(async <T>(
    formData: T,
    validationRules: Record<string, (value: any) => string | null>,
    submitOperation: (data: T) => Promise<any>,
    operationName: string = 'Save'
  ) => {
    // Clear previous errors
    clearAllFieldErrors();
    feedback.clearState();

    // Validate fields
    const errors: Record<string, string> = {};
    Object.entries(validationRules).forEach(([field, validator]) => {
      const value = (formData as any)[field];
      const error = validator(value);
      if (error) {
        errors[field] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      feedback.setError('Please fix the validation errors and try again');
      return null;
    }

    // Submit form
    return feedback.executeWithFeedback(
      () => submitOperation(formData),
      operationName,
      { successMessage: `${operationName} completed successfully` }
    );
  }, [feedback, clearAllFieldErrors]);

  return {
    ...feedback,
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldError,
    getFieldError,
    validateAndSubmit
  };
};

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  numeric: (value: string) => {
    if (value && !/^\d+$/.test(value)) {
      return 'Must be a valid number';
    }
    return null;
  },

  url: (value: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'Must be a valid URL';
    }
    return null;
  }
};