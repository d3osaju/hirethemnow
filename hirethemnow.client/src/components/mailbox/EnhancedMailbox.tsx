import React, { useState, useEffect } from 'react';
import type { MailboxMessage, MailboxStats } from '../../types';
import { Mail, Send, Reply, TrendingUp, Calendar, XCircle, AlertCircle, Star } from 'lucide-react';

const EnhancedMailbox: React.FC = () => {
  const [messages, setMessages] = useState<MailboxMessage[]>([]);
  const [stats, setStats] = useState<MailboxStats | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMailboxData();
  }, []);

  const loadMailboxData = async () => {
    try {
      setLoading(true);

      // Load emails
      const emailsResponse = await fetch('/api/mailbox/emails', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setMessages(emailsData.data || []);
      }

      // Load stats
      const statsResponse = await fetch('/api/mailbox/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Error loading mailbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (message: MailboxMessage) => {
    if (!message.hasAnalysis || message.type === 'sent') return null;

    const badges = [];

    if (message.hasInterviewInvitation) {
      badges.push(
        <span key="interview" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Calendar className="w-3 h-3 mr-1" />
          Interview
        </span>
      );
    }

    if (message.isRejection) {
      badges.push(
        <span key="rejection" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejection
        </span>
      );
    }

    if (message.isPositiveResponse && !message.hasInterviewInvitation) {
      badges.push(
        <span key="positive" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Star className="w-3 h-3 mr-1" />
          Positive
        </span>
      );
    }

    if (message.sentiment === 'Negative' && !message.isRejection) {
      badges.push(
        <span key="negative" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Interested
        </span>
      );
    }

    return badges.length > 0 ? <div className="flex flex-wrap gap-1 mt-2">{badges}</div> : null;
  };

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    return messages.filter(msg => msg.type === filter);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Mailbox</h1>
          <p className="text-gray-600">Track your job application emails and responses</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Emails Sent</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalSent}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Reply className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Replies</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalReplies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Interviews</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.interviewInvitations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Response Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalSent > 0 ? Math.round((stats.totalReplies / stats.totalSent) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mailbox Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Mailbox Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1">
                {['all', 'received', 'sent'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab as typeof filter)}
                    className={`px-3 py-1 text-sm font-medium rounded-md capitalize ${
                      filter === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="divide-y divide-gray-200">
            {getFilteredMessages().length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all'
                    ? 'Your emails will appear here once you upload your resume.'
                    : `No ${filter} messages yet.`}
                </p>
              </div>
            ) : (
              getFilteredMessages().map((message) => (
                <div
                  key={message.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {message.type === 'sent' ? (
                          <Send className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Reply className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {message.type === 'sent' ? 'To' : 'From'}: {message.company}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({message.contactName})
                        </span>
                      </div>

                      <h3 className="mt-1 text-lg font-medium text-gray-900">
                        {message.subject}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {message.content.substring(0, 200)}...
                      </p>

                      {getSentimentBadge(message)}
                    </div>

                    <div className="ml-4 text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(message.receivedAt || message.sentAt)}
                      </p>
                      {message.type === 'received' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New Reply
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedMessage.subject}
                  </h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    {selectedMessage.type === 'sent' ? (
                      <Send className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Reply className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {selectedMessage.type === 'sent' ? 'To' : 'From'}: {selectedMessage.fromEmail}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedMessage.company} • {formatDate(selectedMessage.receivedAt || selectedMessage.sentAt)}
                  </p>

                  {getSentimentBadge(selectedMessage)}
                </div>

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900">
                    {selectedMessage.content}
                  </div>
                </div>

                {selectedMessage.hasAnalysis && (selectedMessage.interviewDetails || selectedMessage.nextSteps) && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                    {selectedMessage.interviewDetails && (
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Interview Details:</strong> {selectedMessage.interviewDetails}
                      </p>
                    )}
                    {selectedMessage.nextSteps && (
                      <p className="text-sm text-blue-800">
                        <strong>Next Steps:</strong> {selectedMessage.nextSteps}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMailbox;