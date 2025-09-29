import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-25 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-gray-800 rounded-full mb-6">
              <span className="text-2xl font-bold text-white">HT</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name}! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to revolutionize your job search? Upload your resume and let our AI do the heavy lifting.
            </p>
          </div>

          {/* Onboarding Complete */}
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Setup Complete</h2>
            <p className="text-gray-600 mb-8">
              Your account is ready! You can now access your dashboard and manage your profile.
            </p>
            <button
              onClick={handleUploadComplete}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;