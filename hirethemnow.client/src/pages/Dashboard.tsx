import React from 'react';
import { Mail } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Mail className="w-6 h-6 mr-3" />
              Email Center
            </h1>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Center Coming Soon</h3>
              <p className="text-gray-600">
                Your email management dashboard will be available here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;