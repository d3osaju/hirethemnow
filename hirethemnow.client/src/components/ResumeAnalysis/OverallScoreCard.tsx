import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ensureNumber } from '../../utils/dataHelpers';

interface OverallScoreCardProps {
  score: number | string | null | undefined;
}

const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ score }) => {
  // Ensure score is always a number, even if backend returns string or null
  const safeScore = ensureNumber(score, 0);


  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 90) return {
      text: 'Excellent! Your resume is exceptionally well-optimized for ATS systems.',
      icon: TrendingUp,
      advice: 'Your resume should pass through most ATS filters with ease.'
    };
    if (score >= 80) return {
      text: 'Great! Your resume is well-optimized for ATS systems.',
      icon: TrendingUp,
      advice: 'Minor tweaks could make it even better, but you\'re in good shape.'
    };
    if (score >= 70) return {
      text: 'Good start! Your resume has solid ATS compatibility.',
      icon: Minus,
      advice: 'Some improvements will help you stand out more to ATS systems.'
    };
    if (score >= 60) return {
      text: 'Fair. Your resume needs some optimization for ATS systems.',
      icon: Minus,
      advice: 'Focus on the recommendations below to improve your ATS score.'
    };
    if (score >= 40) return {
      text: 'Needs improvement. Your resume may struggle with ATS systems.',
      icon: TrendingDown,
      advice: 'Significant changes are needed to improve ATS compatibility.'
    };
    return {
      text: 'Poor ATS compatibility. Your resume needs major improvements.',
      icon: TrendingDown,
      advice: 'Follow all recommendations below to optimize for ATS systems.'
    };
  };

  const interpretation = getScoreInterpretation(safeScore);
  const IconComponent = interpretation.icon;

  // Calculate the stroke dash array for the circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(safeScore / 100) * circumference} ${circumference}`;

  return (
    <div className={`bg-gradient-to-br ${getScoreBgColor(safeScore)} rounded-lg shadow-lg p-8 mb-8`}>
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-6">Overall ATS Score</h2>
        
        <div className="relative inline-block mb-6">
          {/* Background circle */}
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="white"
              strokeWidth="12"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                animation: 'drawCircle 2s ease-out forwards'
              }}
            />
          </svg>
          
          {/* Score display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <div className="text-5xl font-bold mb-1">{safeScore}</div>
              <div className="text-sm opacity-90">out of 100</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-4">
          <IconComponent className="w-6 h-6 mr-2" />
          <p className="text-lg font-medium">
            {interpretation.text}
          </p>
        </div>

        <p className="text-base opacity-90 max-w-2xl mx-auto">
          {interpretation.advice}
        </p>

        {/* Score ranges indicator */}
        <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="text-center">
              <div className="font-semibold">Poor</div>
              <div className="opacity-75">0-39</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Fair</div>
              <div className="opacity-75">40-59</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Good</div>
              <div className="opacity-75">60-79</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Excellent</div>
              <div className="opacity-75">80-100</div>
            </div>
          </div>
          
          {/* Score indicator */}
          <div className="mt-3 relative">
            <div className="h-2 bg-white bg-opacity-30 rounded-full"></div>
            <div 
              className="absolute top-0 h-2 bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${safeScore}%` }}
            ></div>
            <div 
              className="absolute top-0 w-3 h-3 bg-white rounded-full transform -translate-y-0.5 transition-all duration-1000 ease-out"
              style={{ left: `calc(${safeScore}% - 6px)` }}
            ></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drawCircle {
          from {
            stroke-dasharray: 0 ${circumference};
          }
          to {
            stroke-dasharray: ${strokeDasharray};
          }
        }
      `}</style>
    </div>
  );
};

export default OverallScoreCard;