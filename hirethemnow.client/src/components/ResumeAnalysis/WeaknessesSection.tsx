import React from 'react';
import { AlertTriangle, TrendingDown, Target, ArrowRight } from 'lucide-react';
import { ensureArray } from '../../utils/dataHelpers';

interface WeaknessesSectionProps {
  weaknesses: string[] | string | null | undefined;
}

const WeaknessesSection: React.FC<WeaknessesSectionProps> = ({ weaknesses }) => {
  // Ensure weaknesses is always an array, even if backend returns JSON string
  const safeWeaknesses = ensureArray(weaknesses);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <AlertTriangle className="w-6 h-6 mr-2 text-orange-600" />
        Areas for Improvement
      </h3>
      
      {safeWeaknesses.length > 0 ? (
        <div className="space-y-4">
          {safeWeaknesses.map((weakness, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors duration-200 group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {weakness}
                </p>
              </div>
              <div className="flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-orange-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          ))}
          
          {/* Summary card */}
          <div className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6" />
              <div>
                <h4 className="font-semibold">Focus Areas</h4>
                <p className="text-sm opacity-90">
                  {safeWeaknesses.length === 1 
                    ? 'Address this area to improve your ATS score.' 
                    : `Focus on these ${safeWeaknesses.length} areas to significantly boost your ATS compatibility.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Major Weaknesses Found</h4>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Excellent! Your resume doesn't have any significant weaknesses. Check the recommendations 
            section for ways to make it even better.
          </p>
        </div>
      )}

      {/* Tips section */}
      {safeWeaknesses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" />
              Improvement Strategy
            </h4>
            <p className="text-xs text-yellow-700 leading-relaxed">
              Don't be discouraged by these areas for improvement. Each one represents an opportunity 
              to make your resume more competitive. Focus on one area at a time for the best results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeaknessesSection;