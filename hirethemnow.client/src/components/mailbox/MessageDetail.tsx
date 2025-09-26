import React from 'react';
import { MailboxMessage } from '../../types';
import { format } from 'date-fns';
import { ArrowLeft, Star, Gift, X, Mail, Building2, Calendar } from 'lucide-react';

interface MessageDetailProps {
  message: MailboxMessage;
  onBack: () => void;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onBack }) => {
  const getTypeIcon = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'offer':
        return <Gift className="h-5 w-5 text-green-500" />;
      case 'rejection':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Mail className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeText = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return 'Interview Invitation';
      case 'offer':
        return 'Job Offer';
      case 'rejection':
        return 'Application Update';
      default:
        return 'Reply';
    }
  };

  const getActionButtons = (type: MailboxMessage['type']) => {
    switch (type) {
      case 'interview_invitation':
        return (
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Accept Interview
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Propose Different Time
            </button>
          </div>
        );
      case 'offer':
        return (
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Accept Offer
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Negotiate
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Decline
            </button>
          </div>
        );
      default:
        return (
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Reply
          </button>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to messages
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getTypeIcon(message.type)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {message.subject}
              </h3>
              <p className="text-sm text-gray-600">{getTypeText(message.type)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="p-4 space-y-4">
        {/* Message Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">From:</span>
              <span className="text-sm text-gray-900">{message.from}</span>
            </div>
          </div>

          {message.company && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{message.company}</span>
            </div>
          )}

          {message.jobTitle && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Position:</span>
              <span className="text-sm text-gray-900">{message.jobTitle}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Received {format(message.receivedAt, 'PPpp')}
            </span>
          </div>
        </div>

        {/* Message Body */}
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {message.content}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          {getActionButtons(message.type)}
        </div>
      </div>
    </div>
  );
};

export default MessageDetail;