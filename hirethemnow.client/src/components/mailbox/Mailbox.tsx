import React, { useState } from 'react';
import type { MailboxMessage } from '../../types';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import { Mail } from 'lucide-react';

interface MailboxProps {
  messages: MailboxMessage[];
  setMessages: React.Dispatch<React.SetStateAction<MailboxMessage[]>>;
}

const Mailbox: React.FC<MailboxProps> = ({ messages, setMessages }) => {
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(null);

  const markAsRead = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const handleSelectMessage = (message: MailboxMessage) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Job Replies</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedMessage(null)}
            className={`text-sm text-blue-600 hover:text-blue-800 ${
              !selectedMessage ? 'invisible' : ''
            }`}
          >
            Back to list
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-96 overflow-hidden">
        {!selectedMessage ? (
          <MessageList
            messages={messages}
            onSelectMessage={handleSelectMessage}
          />
        ) : (
          <MessageDetail
            message={selectedMessage}
            onBack={() => setSelectedMessage(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Mailbox;