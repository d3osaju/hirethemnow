import React from 'react';
import { CheckCircle, TrendingUp, Star } from 'lucide-react';

interface StrengthsSectionProps {
  strengths: string[];
}

const StrengthsSection: React.FC<StrengthsSectionProps> = ({ strengths }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
        Strengths
      </h3>
      
      {strengths.length > 0 ? (
        <div className="space-y-4">
          {strengths.map((strength, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200 group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {strength}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Star className="w-4 h-4 text-green-500 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          ))}
          
          {/* Summary card */}
          <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <h4 className="font-semibold">Great Job!</h4>
                <p className="text-sm opacity-90">
                  You have {strengths.length} strong {strengths.length === 1 ? 'area' : 'areas'} that will help your resume stand out to ATS systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Strengths Identified</h4>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Don't worry! Focus on the recommendations below to improve your resume and build on your strengths.
          </p>
        </div>
      )}

      {/* Tips section */}
      {strengths.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Keep It Up!
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              These strengths show that your resume is on the right track. Make sure to maintain 
              these positive aspects while working on the areas that need improvement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrengthsSection;