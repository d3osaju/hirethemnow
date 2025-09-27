import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ResumeUpload from '../../components/onboarding/ResumeUpload';

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Upload your resume and we'll handle the rest
            </p>
          </div>

          {/* Resume Upload Component */}
          <ResumeUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;