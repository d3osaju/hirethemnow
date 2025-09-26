import React from 'react';
import { MailboxMessage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Star, Gift, X, Mail } from 'lucide-react';

interface RecentActivityProps {
  messages: MailboxMessage[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ messages }) => {
  const getActivityIcon = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'offer':
        return <Gift className="h-4 w-4 text-green-500" />;
      case 'rejection':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityText = (message: MailboxMessage) => {
    switch (message.type) {
      case 'interview_invitation':
        return `Interview invitation from ${message.company}`;
      case 'offer':
        return `Job offer received from ${message.company}`;
      case 'rejection':
        return `Application update from ${message.company}`;
      default:
        return `New reply from ${message.company || message.from}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

      {messages.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {getActivityText(message)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(message.receivedAt, { addSuffix: true })}
                </p>
              </div>
              {!message.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;