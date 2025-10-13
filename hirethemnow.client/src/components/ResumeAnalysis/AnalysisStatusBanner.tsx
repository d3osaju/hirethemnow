import React from 'react';
import { Loader2, FileText, BarChart3, CheckCircle, Mail } from 'lucide-react';

interface AnalysisStatusBannerProps {
  status: 'waiting_for_parsing' | 'processing';
  message?: string;
  userEmail?: string;
}

const AnalysisStatusBanner: React.FC<AnalysisStatusBannerProps> = ({ 
  status, 
  message, 
  userEmail 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'waiting_for_parsing':
        return {
          icon: FileText,
          title: 'Parsing your resume...',
          description: 'We\'re extracting and structuring the content from your resume.',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
      case 'processing':
        return {
          icon: BarChart3,
          title: 'Analyzing your resume for ATS compatibility...',
          description: 'Our AI is analyzing your resume against ATS best practices and generating detailed feedback.',
          bgColor: 'bg-purple-50',
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          icon: Loader2,
          title: 'Processing...',
          description: 'Please wait while we process your resume.',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center">
        <div className="relative mb-6">
          <div className={`${config.bgColor} rounded-full w-24 h-24 flex items-center justify-center mx-auto animate-pulse`}>
            <IconComponent className={`w-12 h-12 ${config.iconColor}`} />
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <div className="animate-spin rounded-full h-28 w-28 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">{config.title}</h2>
        
        <p className="text-gray-600 mb-2 text-lg">
          {message || config.description}
        </p>

        <p className="text-sm text-gray-500 mb-6 max-w-2xl mx-auto">
          {status === 'waiting_for_parsing' 
            ? 'This usually takes 5-10 seconds. We\'re using PdfPig to extract text and Amazon Bedrock to structure the content.'
            : 'This usually takes 30-60 seconds. We\'re using Amazon Bedrock Nova Pro to analyze your resume comprehensively.'
          }
        </p>

        {userEmail && (
          <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 mb-6 max-w-xl mx-auto`}>
            <div className="flex items-start space-x-3 text-left">
              <div className="flex-shrink-0 mt-1">
                <Mail className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  You'll receive an email when analysis is complete!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Feel free to navigate away - we'll notify you at {userEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 mr-2" />
            Check Status
          </button>
        </div>

        {/* Progress indicators */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Upload</span>
            <span>Parse</span>
            <span>Analyze</span>
            <span>Complete</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full w-full"></div>
            </div>
            <CheckCircle className="w-4 h-4 text-green-600" />
            
            <div className={`flex-1 rounded-full h-2 ${
              status === 'processing' ? 'bg-green-200' : 'bg-blue-200'
            }`}>
              <div className={`h-2 rounded-full ${
                status === 'processing' ? 'bg-green-600 w-full' : 'bg-blue-600 w-3/4 animate-pulse'
              }`}></div>
            </div>
            {status === 'processing' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
            
            <div className={`flex-1 bg-gray-200 rounded-full h-2 ${
              status === 'processing' ? '' : 'opacity-50'
            }`}>
              {status === 'processing' && (
                <div className="bg-purple-600 h-2 rounded-full w-1/2 animate-pulse"></div>
              )}
            </div>
            <div className={`w-4 h-4 rounded-full border-2 ${
              status === 'processing' 
                ? 'border-purple-600 animate-pulse' 
                : 'border-gray-300'
            }`}></div>
            
            <div className="flex-1 bg-gray-200 rounded-full h-2 opacity-50"></div>
            <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisStatusBanner;