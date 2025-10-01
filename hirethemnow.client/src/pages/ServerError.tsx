import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

const ServerError: React.FC = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600 mb-4">500</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Server Error</h2>
          <p className="text-gray-600 text-lg mb-8">
            Something went wrong on our end. We're working to fix it. Please try again later.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh Page
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

export default ServerError;
