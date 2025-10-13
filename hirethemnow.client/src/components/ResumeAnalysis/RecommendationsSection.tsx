import React from 'react';
import { Lightbulb, ArrowUp, CheckSquare, Zap, Star } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: string[];
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
  const getRecommendationIcon = (index: number) => {
    const icons = [Zap, Star, CheckSquare, ArrowUp, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return IconComponent;
  };

  const getPriorityColor = (index: number) => {
    if (index < 2) return 'bg-red-100 text-red-800 border-red-200'; // High priority
    if (index < 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Medium priority
    return 'bg-blue-100 text-blue-800 border-blue-200'; // Lower priority
  };

  const getPriorityLabel = (index: number) => {
    if (index < 2) return 'High Impact';
    if (index < 4) return 'Medium Impact';
    return 'Low Impact';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Lightbulb className="w-6 h-6 mr-2 text-blue-600" />
        Actionable Recommendations
      </h3>
      
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => {
            const IconComponent = getRecommendationIcon(index);
            
            return (
              <div 
                key={index} 
                className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-all duration-200 group"
              >
                {/* Priority badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(index)}`}>
                    {getPriorityLabel(index)}
                  </span>
                </div>

                <div className="flex items-start space-x-4 pr-20">
                  {/* Number and icon */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                      <IconComponent className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                  
                  {/* Recommendation text */}
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                </div>

                {/* Action indicator */}
                <div className="mt-3 ml-12 flex items-center text-sm text-blue-600">
                  <CheckSquare className="w-4 h-4 mr-1" />
                  <span className="font-medium">Action Item</span>
                </div>
              </div>
            );
          })}
          
          {/* Summary card */}
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <ArrowUp className="w-6 h-6" />
              <div>
                <h4 className="font-semibold">Implementation Strategy</h4>
                <p className="text-sm opacity-90">
                  Start with high-impact recommendations first. Each improvement will boost your ATS score 
                  and increase your chances of getting noticed by recruiters.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Needed</h4>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Fantastic! Your resume is already well-optimized. Keep up the great work and 
            consider minor tweaks based on specific job requirements.
          </p>
        </div>
      )}

      {/* Tips section */}
      {recommendations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-1" />
              Pro Tip
            </h4>
            <p className="text-xs text-purple-700 leading-relaxed">
              Implement these recommendations one at a time and re-analyze your resume to track 
              your progress. Focus on the high-impact items first for maximum improvement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;