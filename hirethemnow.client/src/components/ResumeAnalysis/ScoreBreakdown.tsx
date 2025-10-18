import React from 'react';
import { Target, FileText, Hash, Briefcase, GraduationCap, Zap, Award } from 'lucide-react';
import { ensureNumber } from '../../utils/dataHelpers';

interface ScoreBreakdownProps {
  scores: {
    formatting: number | string | null | undefined;
    keywords: number | string | null | undefined;
    experience: number | string | null | undefined;
    education: number | string | null | undefined;
    skills: number | string | null | undefined;
    achievements: number | string | null | undefined;
  };
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  // Ensure all scores are numbers, even if backend returns strings or null
  const safeScores = {
    formatting: ensureNumber(scores.formatting, 0),
    keywords: ensureNumber(scores.keywords, 0),
    experience: ensureNumber(scores.experience, 0),
    education: ensureNumber(scores.education, 0),
    skills: ensureNumber(scores.skills, 0),
    achievements: ensureNumber(scores.achievements, 0)
  };
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
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const scoreItems = [
    {
      key: 'formatting',
      label: 'Formatting',
      score: safeScores.formatting,
      icon: FileText,
      description: 'ATS-friendly structure and layout',
      weight: '20%'
    },
    {
      key: 'keywords',
      label: 'Keywords',
      score: safeScores.keywords,
      icon: Hash,
      description: 'Industry-relevant keywords and phrases',
      weight: '25%'
    },
    {
      key: 'experience',
      label: 'Experience',
      score: safeScores.experience,
      icon: Briefcase,
      description: 'Work history presentation and impact',
      weight: '25%'
    },
    {
      key: 'education',
      label: 'Education',
      score: safeScores.education,
      icon: GraduationCap,
      description: 'Educational background completeness',
      weight: '10%'
    },
    {
      key: 'skills',
      label: 'Skills',
      score: safeScores.skills,
      icon: Zap,
      description: 'Technical and soft skills presentation',
      weight: '15%'
    },
    {
      key: 'achievements',
      label: 'Achievements',
      score: safeScores.achievements,
      icon: Award,
      description: 'Quantifiable results and accomplishments',
      weight: '5%'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Target className="w-6 h-6 mr-2 text-blue-600" />
        Score Breakdown
      </h3>
      
      <div className="space-y-6">
        {scoreItems.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <div key={item.key} className="group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getScoreBgLightColor(item.score)} group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className={`w-5 h-5 ${getScoreColor(item.score)}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {item.weight}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                    {item.score}
                  </span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBgColor(item.score)} transition-all duration-1000 ease-out rounded-full relative`}
                    style={{ 
                      width: `${item.score}%`,
                      animationDelay: `${scoreItems.indexOf(item) * 100}ms`
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Score labels */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Score interpretation */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  item.score >= 80 
                    ? 'bg-green-100 text-green-800' 
                    : item.score >= 60 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.score >= 80 ? 'Excellent' : item.score >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Scoring Methodology</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Your overall score is calculated using a weighted average: Keywords (25%), Experience (25%), 
            Formatting (20%), Skills (15%), Education (10%), and Achievements (5%). Focus on improving 
            the highest-weighted categories for maximum impact.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;