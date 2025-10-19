import React from 'react';
import EmailCenter from '../components/email/EmailCenter';

const EmailCenterPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Center</h1>
          <p className="mt-2 text-gray-600">
            Manage your generated cold emails and send them through Gmail integration.
          </p>
        </div>
        <EmailCenter />
      </div>
    </div>
  );
};

export default EmailCenterPage;