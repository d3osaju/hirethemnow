import React from 'react';
import { Eye, AlertTriangle, CheckCircle, BookOpen, FileText } from 'lucide-react';

interface ReadabilitySectionProps {
  score: number;
  issues: string[];
}

const ReadabilitySection: React.FC<ReadabilitySectionProps> = ({ score, issues }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getScoreBgLightColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Your resume is easy to read and well-structured.';
    if (score >= 60) return 'Your resume is generally readable with minor issues.';
    return 'Your resume has readability issues that may affect ATS parsing.';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Eye className="w-6 h-6 mr-2 text-blue-600" />
        Readability Analysis
      </h3>

      {/* Readability Score */}
      <div className={`mb-6 p-4 rounded-lg border ${getScoreBgLightColor(score)}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className={`w-5 h-5 ${getScoreColor(score)}`} />
            <span className="font-semibold text-gray-900">Readability Score</span>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-sm text-gray-500">/100</span>
            <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ml-2 ${
              score >= 80 
                ? 'bg-green-100 text-green-800' 
                : score >= 60 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {getScoreLabel(score)}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full ${getScoreBgColor(score)} transition-all duration-1000 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-700">
          {getScoreDescription(score)}
        </p>
      </div>

      {/* Readability Issues */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          {issues.length > 0 ? (
            <>
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900">Readability Issues</h4>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {issues.length}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Readability Status</h4>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                No Issues
              </span>
            </>
          )}
        </div>
        
        {issues.length > 0 ? (
          <div className="space-y-2">
            {issues.map((issue, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-800 leading-relaxed">
                  {issue}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">
              Great! No readability issues detected.
            </p>
            <p className="text-xs text-green-600 mt-1">
              Your resume is clear and easy to read.
            </p>
          </div>
        )}
      </div>

      {/* Readability Scale */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Readability Scale</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">90-100</span>
            <span className="text-green-600">Excellent - Very easy to read</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">80-89</span>
            <span className="text-green-600">Very Good - Easy to read</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">70-79</span>
            <span className="text-yellow-600">Good - Fairly easy to read</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">60-69</span>
            <span className="text-yellow-600">Fair - Standard readability</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">Below 60</span>
            <span className="text-red-600">Poor - Difficult to read</span>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Readability Tips
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use bullet points for easy scanning</li>
            <li>• Keep sentences concise and clear</li>
            <li>• Use active voice instead of passive voice</li>
            <li>• Avoid overly complex technical jargon</li>
            <li>• Use consistent formatting throughout</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReadabilitySection;