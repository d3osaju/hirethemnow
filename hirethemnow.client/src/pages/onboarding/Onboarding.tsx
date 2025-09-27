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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-neutral-100">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-full mb-6">
              <span className="text-2xl font-bold text-white">HT</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-jobpilot-navy mb-4">
              Welcome, {user?.name}! 🎉
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Ready to revolutionize your job search? Upload your resume and let our AI do the heavy lifting.
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