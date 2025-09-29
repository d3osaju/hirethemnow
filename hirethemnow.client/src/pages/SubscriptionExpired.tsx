import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, Mail } from 'lucide-react';

const SubscriptionExpired: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <Clock className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Trial Period Ended
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-blue-900 text-left">
                Your 7-day free trial has ended. Thank you for participating in our Beta program!
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-8">
            We're currently working on our payment system. You'll be notified via email as soon as subscription options become available.
          </p>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
              <Mail className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Stay Updated</h3>
              <p className="text-sm text-blue-100">
                We'll send you an email when subscriptions are available. Be the first to get back in!
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Login
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@hirethemnow.com" className="text-blue-600 hover:underline">
                support@hirethemnow.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;