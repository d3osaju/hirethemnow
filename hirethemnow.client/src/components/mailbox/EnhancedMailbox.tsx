import React, { useState, useEffect } from 'react';
import type { MailboxMessage, MailboxStats } from '../../types';
import { Mail, Send, Reply, TrendingUp, Calendar, XCircle, AlertCircle, Star, Search, Filter, MoreVertical } from 'lucide-react';
import { mailboxAPI } from '../../services/api';

const EnhancedMailbox: React.FC = () => {
  const [messages, setMessages] = useState<MailboxMessage[]>([]);
  const [stats, setStats] = useState<MailboxStats | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMailboxData();
  }, []);

  const loadMailboxData = async () => {
    try {
      setLoading(true);

      // Load emails
      const emailsResult = await mailboxAPI.getEmails();
      if (emailsResult.success) {
        setMessages(emailsResult.data || []);
      }

      // TODO: Add stats API endpoint to mailboxAPI when backend implements it
      // For now, calculate basic stats from the messages
      const emails = emailsResult.data || [];
      const sentCount = emails.filter(email => email.type === 'sent').length;
      const receivedCount = emails.filter(email => email.type === 'received').length;
      const responseRate = sentCount > 0 ? (receivedCount / sentCount) * 100 : 0;

      setStats({
        totalSent: sentCount,
        totalReceived: receivedCount,
        responseRate: responseRate,
        totalReplies: receivedCount,
        totalOpened: 0, // Not implemented yet
        interviewInvitations: emails.filter(email => email.hasInterviewInvitation).length,
        rejections: emails.filter(email => email.isRejection).length,
        positiveResponses: emails.filter(email => email.isPositiveResponse).length,
        pendingResponses: emails.filter(email => email.type === 'sent' && email.status === 'pending').length,
        pendingReplies: emails.filter(email => email.type === 'received' && email.status === 'pending').length
      });

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
        <span key="interview" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-100 text-success-700 border border-success-200">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Interview
        </span>
      );
    }

    if (message.isRejection) {
      badges.push(
        <span key="rejection" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-error-100 text-error-700 border border-error-200">
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Rejected
        </span>
      );
    }

    if (message.isPositiveResponse && !message.hasInterviewInvitation) {
      badges.push(
        <span key="positive" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200">
          <Star className="w-3.5 h-3.5 mr-1.5" />
          Positive
        </span>
      );
    }

    if (message.sentiment === 'Negative' && !message.isRejection) {
      badges.push(
        <span key="negative" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
          Not Interested
        </span>
      );
    }

    return badges.length > 0 ? <div className="flex flex-wrap gap-2 mt-3">{badges}</div> : null;
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
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-200 rounded-lg w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-neutral-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-jobpilot-navy mb-3">Email Center</h1>
              <p className="text-lg text-neutral-600">Track your automated job applications and responses</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-80 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Emails Sent</p>
                  <p className="text-3xl font-bold text-jobpilot-navy mt-2">{stats.totalSent}</p>
                  <p className="text-xs text-neutral-400 mt-1">Total outreach</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Send className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Replies</p>
                  <p className="text-3xl font-bold text-jobpilot-navy mt-2">{stats.totalReplies}</p>
                  <p className="text-xs text-neutral-400 mt-1">Responses received</p>
                </div>
                <div className="p-3 bg-success-100 rounded-lg">
                  <Reply className="h-8 w-8 text-success-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Interviews</p>
                  <p className="text-3xl font-bold text-jobpilot-navy mt-2">{stats.interviewInvitations}</p>
                  <p className="text-xs text-neutral-400 mt-1">Opportunities</p>
                </div>
                <div className="p-3 bg-secondary-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-secondary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Response Rate</p>
                  <p className="text-3xl font-bold text-jobpilot-navy mt-2">
                    {stats.totalSent > 0 ? Math.round((stats.totalReplies / stats.totalSent) * 100) : 0}%
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Success metric</p>
                </div>
                <div className="p-3 bg-warning-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-warning-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mailbox Content */}
        <div className="bg-white rounded-xl shadow-card border border-neutral-100">
          {/* Mailbox Header */}
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Mail className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-jobpilot-navy">Messages</h2>
                  <p className="text-sm text-neutral-500 mt-1">{getFilteredMessages().length} emails</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-neutral-100 rounded-lg p-1">
                {[
                  { key: 'all', label: 'All', count: messages.length },
                  { key: 'received', label: 'Received', count: messages.filter(m => m.type === 'received').length },
                  { key: 'sent', label: 'Sent', count: messages.filter(m => m.type === 'sent').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as typeof filter)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center space-x-2 ${
                      filter === tab.key
                        ? 'bg-white text-primary-700 shadow-button'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      filter === tab.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="divide-y divide-neutral-100">
            {getFilteredMessages().length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                  <Mail className="h-10 w-10 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-jobpilot-navy mb-2">No messages yet</h3>
                <p className="text-neutral-500 max-w-sm mx-auto">
                  {filter === 'all'
                    ? 'Your email campaigns will appear here once you upload your resume and start the job hunt.'
                    : `No ${filter} messages found. Try switching to a different filter.`}
                </p>
                {filter === 'all' && (
                  <button className="mt-6 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200">
                    Upload Resume
                  </button>
                )}
              </div>
            ) : (
              getFilteredMessages().map((message) => (
                <div
                  key={message.id}
                  className="p-6 hover:bg-neutral-50 cursor-pointer transition-all duration-200 group"
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-1.5 rounded-lg ${
                          message.type === 'sent'
                            ? 'bg-primary-100'
                            : 'bg-success-100'
                        }`}>
                          {message.type === 'sent' ? (
                            <Send className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Reply className="h-4 w-4 text-success-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-jobpilot-navy">
                            {message.type === 'sent' ? 'To' : 'From'}: {message.company}
                          </span>
                          <span className="text-sm text-neutral-500">
                            • {message.contactName}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-jobpilot-navy mb-2 group-hover:text-primary-600 transition-colors duration-200">
                        {message.subject}
                      </h3>

                      <p className="text-neutral-600 line-clamp-2 mb-3">
                        {message.content.substring(0, 180)}...
                      </p>

                      {getSentimentBadge(message)}
                    </div>

                    <div className="ml-6 text-right flex flex-col items-end space-y-2">
                      <p className="text-sm text-neutral-500 font-medium">
                        {formatDate(message.receivedAt || message.sentAt)}
                      </p>
                      {message.type === 'received' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-success-100 text-success-700 border border-success-200">
                          <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                          New Reply
                        </span>
                      )}
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8">
            <div className="relative mx-auto p-0 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl bg-white rounded-2xl shadow-2xl animate-scale-in">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-neutral-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        selectedMessage.type === 'sent'
                          ? 'bg-primary-100'
                          : 'bg-success-100'
                      }`}>
                        {selectedMessage.type === 'sent' ? (
                          <Send className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Reply className="h-5 w-5 text-success-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-jobpilot-navy">
                          {selectedMessage.subject}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {selectedMessage.type === 'sent' ? 'To' : 'From'}: {selectedMessage.fromEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-600">
                        {selectedMessage.company} • {formatDate(selectedMessage.receivedAt || selectedMessage.sentAt)}
                      </p>
                      {getSentimentBadge(selectedMessage)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-96 overflow-y-auto">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-jobpilot-navy leading-relaxed">
                    {selectedMessage.content}
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {selectedMessage.hasAnalysis && (selectedMessage.interviewDetails || selectedMessage.nextSteps) && (
                <div className="px-8 py-6 bg-primary-50 border-t border-primary-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Star className="h-5 w-5 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-primary-900">AI Analysis</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedMessage.interviewDetails && (
                      <div className="p-4 bg-white rounded-lg border border-primary-200">
                        <p className="text-sm font-semibold text-primary-900 mb-1">Interview Details:</p>
                        <p className="text-sm text-primary-800">{selectedMessage.interviewDetails}</p>
                      </div>
                    )}
                    {selectedMessage.nextSteps && (
                      <div className="p-4 bg-white rounded-lg border border-primary-200">
                        <p className="text-sm font-semibold text-primary-900 mb-1">Next Steps:</p>
                        <p className="text-sm text-primary-800">{selectedMessage.nextSteps}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="px-8 py-4 bg-neutral-50 rounded-b-2xl border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">
                    Message ID: {selectedMessage.id}
                  </p>
                  <div className="flex items-center space-x-3">
                    <button className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800 transition-colors duration-200">
                      Mark as Read
                    </button>
                    <button className="px-6 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMailbox;