import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogIn, ShieldAlert } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <ShieldAlert className="h-24 w-24 text-yellow-600" />
          </div>
          <h1 className="text-9xl font-bold text-yellow-600 mb-4">401</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 text-lg mb-8">
            You don't have permission to access this page. Please log in or contact support if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Log In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
