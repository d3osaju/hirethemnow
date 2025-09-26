import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { MailboxMessage } from '../types';
import Mailbox from '../components/mailbox/Mailbox';
import StatsOverview from '../components/dashboard/StatsOverview';
import RecentActivity from '../components/dashboard/RecentActivity';
import { Mail, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MailboxMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockMessages: MailboxMessage[] = [
      {
        id: '1',
        from: 'hr@techcorp.com',
        subject: 'Thank you for your interest in Senior Developer position',
        content: 'Dear Candidate, thank you for applying to our Senior Developer position. We have received your application and will review it shortly. We will get back to you within 3-5 business days.',
        jobTitle: 'Senior Developer',
        company: 'TechCorp',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        type: 'reply'
      },
      {
        id: '2',
        from: 'recruiting@startup.io',
        subject: 'Interview Invitation - Frontend Engineer Role',
        content: 'Hi there! We were impressed by your profile and would like to invite you for an interview for the Frontend Engineer position. Please let us know your availability for next week.',
        jobTitle: 'Frontend Engineer',
        company: 'StartupIO',
        receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        type: 'interview_invitation'
      },
      {
        id: '3',
        from: 'noreply@bigtechco.com',
        subject: 'Application Status Update',
        content: 'Thank you for your interest in joining our team. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future openings.',
        jobTitle: 'Full Stack Developer',
        company: 'BigTechCo',
        receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true,
        type: 'rejection'
      },
      {
        id: '4',
        from: 'talent@remotefirst.com',
        subject: 'Job Offer - Remote React Developer',
        content: 'Congratulations! We are pleased to extend a job offer for the Remote React Developer position. Please find the offer details attached. We look forward to having you on our team!',
        jobTitle: 'Remote React Developer',
        company: 'RemoteFirst',
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        read: true,
        type: 'offer'
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      setMessages(mockMessages);
      setLoading(false);
    }, 1000);
  }, []);

  const stats = {
    totalApplications: 45,
    pendingReplies: messages.filter(m => !m.read).length,
    interviews: messages.filter(m => m.type === 'interview_invitation').length,
    offers: messages.filter(m => m.type === 'offer').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your job search
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Replies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReplies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.interviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Offers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.offers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mailbox */}
          <div className="lg:col-span-2">
            <Mailbox messages={messages} setMessages={setMessages} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StatsOverview stats={stats} />
            <RecentActivity messages={messages.slice(0, 3)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;