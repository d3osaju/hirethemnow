import React, { useState, useEffect } from 'react';
import { emailAPI } from '../../services/api';
import type { EmailRecord } from '../../types';
import EmailTable from './EmailTable.tsx';
import { GmailService } from '../../services/gmailService';
import toast from 'react-hot-toast';

const EmailCenter: React.FC = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await emailAPI.getUserEmails();
      
      if (response.success) {
        setEmails(response.data);
      } else {
        setError(response.message || 'Failed to fetch emails');
        toast.error('Failed to load emails');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (email: EmailRecord) => {
    try {
      // Format email body with resume URL
      const formattedBody = GmailService.formatEmailBody(email.body, email.resumeUrl);
      
      // Open Gmail compose with pre-filled data
      GmailService.openCompose({
        to: email.toEmail,
        subject: email.subject,
        body: formattedBody
      });
      
      // Mark email as sent immediately when Gmail opens
      const response = await emailAPI.markEmailAsSent(email.id);
      
      if (response.success) {
        // Remove email from the list
        setEmails(prevEmails => prevEmails.filter(e => e.id !== email.id));
        toast.success('Email opened in Gmail and marked as sent');
      } else {
        toast.error('Gmail opened but failed to mark email as sent');
      }
    } catch (err) {
      toast.error('Failed to process email');
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading emails...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Emails</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEmails}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {emails.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
          <p className="text-gray-600">
            You don't have any generated cold emails yet. Check back later or contact support if you expect to see emails here.
          </p>
        </div>
      ) : (
        <EmailTable 
          emails={emails} 
          onSendEmail={handleSendEmail}
          loading={false}
        />
      )}
    </div>
  );
};

export default EmailCenter;