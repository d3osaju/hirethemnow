import React from 'react';
import { Hash, CheckCircle, AlertCircle, TrendingUp, Search, Plus } from 'lucide-react';

interface KeywordsAnalysisProps {
  keywordsFound: string[];
  keywordsMissing: string[];
  keywordDensity: number;
}

const KeywordsAnalysis: React.FC<KeywordsAnalysisProps> = ({ 
  keywordsFound, 
  keywordsMissing, 
  keywordDensity 
}) => {
  const getDensityColor = (density: number) => {
    if (density >= 70) return 'text-green-600';
    if (density >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDensityBgColor = (density: number) => {
    if (density >= 70) return 'bg-green-600';
    if (density >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getDensityLabel = (density: number) => {
    if (density >= 70) return 'Excellent';
    if (density >= 50) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Hash className="w-6 h-6 mr-2 text-blue-600" />
        Keywords Analysis
      </h3>

      {/* Keyword Density */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Keyword Density</span>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${getDensityColor(keywordDensity)}`}>
              {keywordDensity}%
            </span>
            <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ml-2 ${
              keywordDensity >= 70 
                ? 'bg-green-100 text-green-800' 
                : keywordDensity >= 50 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {getDensityLabel(keywordDensity)}
            </div>
          </div>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getDensityBgColor(keywordDensity)} transition-all duration-1000 ease-out`}
            style={{ width: `${keywordDensity}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {keywordDensity >= 70 
            ? 'Great keyword coverage! Your resume includes most relevant industry terms.'
            : keywordDensity >= 50 
            ? 'Good keyword usage, but there\'s room for improvement.'
            : 'Low keyword density. Consider adding more industry-relevant terms.'
          }
        </p>
      </div>

      {/* Keywords Found */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Keywords Found</h4>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            {keywordsFound.length}
          </span>
        </div>
        
        {keywordsFound.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywordsFound.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200 hover:bg-green-200 transition-colors duration-200"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No keywords identified yet</p>
          </div>
        )}
      </div>

      {/* Keywords Missing */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h4 className="font-semibold text-gray-900">Suggested Keywords</h4>
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
            {keywordsMissing.length}
          </span>
        </div>
        
        {keywordsMissing.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywordsMissing.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full border border-orange-200 hover:bg-orange-200 transition-colors duration-200 cursor-pointer"
                title="Consider adding this keyword to your resume"
              >
                <Plus className="w-3 h-3 mr-1" />
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">
              Excellent! No additional keywords needed.
            </p>
          </div>
        )}
      </div>

      {/* Tips section */}
      <div className="pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <Hash className="w-4 h-4 mr-1" />
            Keyword Optimization Tips
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Include keywords naturally in your experience descriptions</li>
            <li>• Use both full terms and abbreviations (e.g., "JavaScript" and "JS")</li>
            <li>• Match keywords from job descriptions you're targeting</li>
            <li>• Avoid keyword stuffing - maintain readability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KeywordsAnalysis;