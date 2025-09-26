import React from 'react';
import { MailboxMessage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MailOpen, Star, Clock, CheckCircle, X, Gift } from 'lucide-react';

interface MessageListProps {
  messages: MailboxMessage[];
  onSelectMessage: (message: MailboxMessage) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onSelectMessage }) => {
  const getMessageIcon = (type: MailboxMessage['type']) => {
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

  const getTypeLabel = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return 'Interview';
      case 'offer':
        return 'Offer';
      case 'rejection':
        return 'Update';
      default:
        return 'Reply';
    }
  };

  const getTypeBadgeColor = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejection':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your job application replies will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {messages.map((message) => (
          <div
            key={message.id}
            onClick={() => onSelectMessage(message)}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              !message.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Message Icon */}
              <div className="flex-shrink-0 mt-1">
                {message.read ? (
                  <MailOpen className="h-5 w-5 text-gray-400" />
                ) : (
                  <Mail className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {getMessageIcon(message.type)}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(message.type)}`}>
                      {getTypeLabel(message.type)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(message.receivedAt, { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {message.from}
                  </span>
                  {!message.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                {message.company && message.jobTitle && (
                  <p className="text-xs text-gray-600 mb-2">
                    {message.jobTitle} at {message.company}
                  </p>
                )}

                <p className={`text-sm ${!message.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {message.subject}
                </p>

                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageList;