import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Clock,
  Zap,
  TrendingUp,
  Users,
  FileText,
  Settings
} from 'lucide-react';


export interface FeedbackMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

export interface AdminFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
  className?: string;
}

// Main feedback component for displaying multiple messages
export const AdminFeedback: React.FC<AdminFeedbackProps> = ({
  messages,
  onDismiss,
  className = ''
}) => {
  if (messages.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message) => (
        <FeedbackCard
          key={message.id}
          message={message}
          onDismiss={() => onDismiss(message.id)}
        />
      ))}
    </div>
  );
};

// Individual feedback card
const FeedbackCard: React.FC<{
  message: FeedbackMessage;
  onDismiss: () => void;
}> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message.persistent && message.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, [message.duration, message.persistent, onDismiss]);

  const getConfig = () => {
    switch (message.type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-800'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${config.titleColor}`}>
            {message.title}
          </h4>
          <p className={`mt-1 text-sm ${config.messageColor}`}>
            {message.message}
          </p>
          
          {message.action && (
            <button
              onClick={message.action.onClick}
              className={`mt-2 text-sm font-medium underline ${config.titleColor} hover:no-underline`}
            >
              {message.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className={`${config.iconColor} hover:opacity-75 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Success notification component
export const SuccessNotification: React.FC<{
  title: string;
  message: string;
  onClose?: () => void;
  showIcon?: boolean;
  className?: string;
}> = ({ title, message, onClose, showIcon = true, className = '' }) => (
  <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
    <div className="flex items-start space-x-3">
      {showIcon && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <h4 className="text-sm font-medium text-green-900">{title}</h4>
        <p className="mt-1 text-sm text-green-800">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-green-600 hover:text-green-800">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// Operation status indicator
export const OperationStatus: React.FC<{
  status: 'idle' | 'loading' | 'success' | 'error';
  operation: string;
  className?: string;
}> = ({ status, operation, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          message: `${operation} in progress...`
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          message: `${operation} completed successfully`
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          message: `${operation} failed`
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.message}
        </span>
      </div>
    </div>
  );
};

// Bulk operation progress
export const BulkOperationProgress: React.FC<{
  total: number;
  completed: number;
  failed: number;
  operation: string;
  onCancel?: () => void;
  className?: string;
}> = ({ total, completed, failed, operation, onCancel, className = '' }) => {
  const percentage = Math.round(((completed + failed) / total) * 100);
  const isComplete = completed + failed === total;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          {operation} Progress
        </h4>
        {onCancel && !isComplete && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{completed + failed} of {total}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span className="text-green-600">✓ {completed} successful</span>
          {failed > 0 && <span className="text-red-600">✗ {failed} failed</span>}
        </div>
      </div>
    </div>
  );
};

// Activity indicator for real-time updates
export const ActivityIndicator: React.FC<{
  activities: Array<{
    id: string;
    type: 'user' | 'job' | 'system' | 'data';
    message: string;
    timestamp: Date;
  }>;
  maxItems?: number;
  className?: string;
}> = ({ activities, maxItems = 5, className = '' }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'job':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-600" />;
      case 'data':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Zap className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const recentActivities = activities.slice(0, maxItems);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
        <Zap className="w-4 h-4 mr-2" />
        Recent Activity
      </h4>
      
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
};

// Quick action feedback
export const QuickActionFeedback: React.FC<{
  action: string;
  status: 'pending' | 'success' | 'error';
  onRetry?: () => void;
  className?: string;
}> = ({ action, status, onRetry, className = '' }) => {
  if (status === 'pending') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-blue-600 ${className}`}>
        <Clock className="w-4 h-4 animate-spin" />
        <span>{action}...</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span>{action} successful</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
      <AlertTriangle className="w-4 h-4" />
      <span>{action} failed</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline ml-2"
        >
          Retry
        </button>
      )}
    </div>
  );
};

// Hook for managing feedback messages
export const useFeedbackMessages = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const addMessage = (message: Omit<FeedbackMessage, 'id'>) => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => [...prev, { ...message, id }]);
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const addSuccess = (title: string, message: string, action?: FeedbackMessage['action']) => {
    addMessage({ type: 'success', title, message, action, duration: 5000 });
  };

  const addError = (title: string, message: string, action?: FeedbackMessage['action']) => {
    addMessage({ type: 'error', title, message, action, persistent: true });
  };

  const addWarning = (title: string, message: string, action?: FeedbackMessage['action']) => {
    addMessage({ type: 'warning', title, message, action, duration: 7000 });
  };

  const addInfo = (title: string, message: string, action?: FeedbackMessage['action']) => {
    addMessage({ type: 'info', title, message, action, duration: 5000 });
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    addSuccess,
    addError,
    addWarning,
    addInfo
  };
};