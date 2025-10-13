import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import type { SectionFeedback } from '../../types';

interface SectionDetailsProps {
  sections: SectionFeedback[];
}

const SectionDetails: React.FC<SectionDetailsProps> = ({ sections }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getSectionIcon = (sectionName: string) => {
    const name = sectionName.toLowerCase();
    if (name.includes('personal') || name.includes('contact')) return '👤';
    if (name.includes('summary') || name.includes('objective')) return '📝';
    if (name.includes('experience') || name.includes('work')) return '💼';
    if (name.includes('education')) return '🎓';
    if (name.includes('skills')) return '⚡';
    if (name.includes('certification')) return '🏆';
    if (name.includes('project')) return '🚀';
    if (name.includes('format')) return '📄';
    return '📋';
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-blue-600" />
        Detailed Section Analysis
      </h3>
      
      <div className="space-y-4">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.sectionName);
          
          return (
            <div 
              key={index} 
              className={`border rounded-lg transition-all duration-300 ${
                isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.sectionName)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-t-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSectionIcon(section.sectionName)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {section.sectionName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-sm font-medium ${getScoreColor(section.score)}`}>
                        Score: {section.score}/100
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreBgColor(section.score)}`}>
                        {section.score >= 80 ? 'Excellent' : section.score >= 60 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {section.issues.length > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                      {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {section.suggestions.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {section.suggestions.length} tip{section.suggestions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                  {/* Score Bar */}
                  <div className="mb-4 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Section Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(section.score)}`}>
                        {section.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          section.score >= 80 ? 'bg-green-600' : section.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${section.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Issues */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                        Issues Found
                      </h5>
                      {section.issues.length > 0 ? (
                        <div className="space-y-2">
                          {section.issues.map((issue, issueIndex) => (
                            <div 
                              key={issueIndex}
                              className="flex items-start space-x-2 p-2 bg-orange-50 rounded border border-orange-200"
                            >
                              <AlertTriangle className="w-3 h-3 text-orange-600 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-800">{issue}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-green-50 rounded border border-green-200">
                          <Target className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-sm text-green-700 font-medium">No issues found</p>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                        Suggestions
                      </h5>
                      {section.suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {section.suggestions.map((suggestion, suggestionIndex) => (
                            <div 
                              key={suggestionIndex}
                              className="flex items-start space-x-2 p-2 bg-blue-50 rounded border border-blue-200"
                            >
                              <Lightbulb className="w-3 h-3 text-blue-600 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-800">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 rounded border border-gray-200">
                          <Lightbulb className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-sm text-gray-600">No suggestions needed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Section Analysis Summary
          </h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            This detailed breakdown shows how each section of your resume performs. Focus on sections 
            with lower scores and address the specific issues highlighted. Click on any section above 
            to expand and see detailed feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectionDetails;