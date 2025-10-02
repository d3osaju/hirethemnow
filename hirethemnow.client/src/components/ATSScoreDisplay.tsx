import React, { useState, useEffect } from 'react';
import { Brain, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle, Loader, Target, Zap, Award, AlertTriangle } from 'lucide-react';

interface ATSScoreDisplayProps {
  applicationId: number;
  autoLoad?: boolean;
}

interface ATSAnalysis {
  applicationId: number;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
    achievements: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    gpa?: string;
  }>;
  certifications?: string[];
  summary?: string;
  atsScore?: {
    overall: number;
    breakdown: {
      formatting: number;
      keywords: number;
      experience: number;
      education: number;
      skills: number;
      achievements: number;
    };
  };
  strengths?: string[];
  weaknesses?: string[];
  improvements?: Array<{
    category: string;
    issue: string;
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
    priority: number;
  }>;
  keywords?: {
    found: string[];
    missing: string[];
    density: number;
  };
  readability?: {
    score: number;
    issues: string[];
  };
  recommendations?: string[];
  processedAt?: string;
}

export const ATSScoreDisplay: React.FC<ATSScoreDisplayProps> = ({ applicationId, autoLoad = false }) => {
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad) {
      analyzeResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, autoLoad]);

  const analyzeResume = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/aiagent/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.message || 'Failed to analyze resume');
      }
    } catch (err) {
      setError('Error analyzing resume. Please try again.');
      console.error('Error analyzing resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-600 bg-red-100';
    if (impact === 'medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getImpactIcon = (impact: string) => {
    if (impact === 'high') return <AlertTriangle className="w-4 h-4" />;
    if (impact === 'medium') return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ATS Score Analysis</h2>
            <p className="text-sm text-gray-600">AI-powered resume evaluation</p>
          </div>
        </div>
        {!analysis && (
          <button
            onClick={analyzeResume}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {analysis && analysis.atsScore && (
        <div className="space-y-6">
          {/* Overall Score - Large Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border-2 border-blue-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Overall ATS Score</p>
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <svg className="w-32 h-32" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={analysis.atsScore.overall >= 80 ? '#10b981' : analysis.atsScore.overall >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${analysis.atsScore.overall}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(analysis.atsScore.overall)}`}>
                      {analysis.atsScore.overall}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-3xl font-bold ${getScoreColor(analysis.atsScore.overall)}`}>
                    {getScoreLabel(analysis.atsScore.overall)}
                  </p>
                  <p className="text-gray-600 mt-1">
                    Your resume scores in the{' '}
                    <span className="font-semibold">
                      {analysis.atsScore.overall >= 80 ? 'top tier' : analysis.atsScore.overall >= 60 ? 'good range' : 'needs improvement range'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Score Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.atsScore.breakdown).map(([category, score]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                    <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBgColor(score)} transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-900">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-orange-900">
                    <XCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Suggestions */}
          {analysis.improvements && analysis.improvements.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Actionable Improvements
              </h3>
              <div className="space-y-3">
                {analysis.improvements
                  .sort((a, b) => b.priority - a.priority)
                  .slice(0, 5)
                  .map((improvement, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-semibold text-gray-800">{improvement.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getImpactColor(improvement.impact)}`}>
                            {getImpactIcon(improvement.impact)}
                            {improvement.impact.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                            Priority: {improvement.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Issue:</span> {improvement.issue}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">✓ Suggestion:</span> {improvement.suggestion}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Keywords Analysis */}
          {analysis.keywords && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Keyword Analysis
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.keywords.found.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 mb-2">Found Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywords.found.slice(0, 10).map((keyword, i) => (
                        <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.keywords.missing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywords.missing.slice(0, 10).map((keyword, i) => (
                        <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Keyword Density</span>
                  <span className="text-sm font-semibold text-gray-800">{analysis.keywords.density}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBgColor(analysis.keywords.density)}`}
                    style={{ width: `${analysis.keywords.density}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="text-blue-600 font-bold mt-0.5">{index + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          {analysis.processedAt && (
            <div className="text-xs text-gray-500 text-right">
              Analyzed: {new Date(analysis.processedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {!loading && !analysis && !error && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Ready to Analyze Your Resume</p>
          <p className="text-sm">Get instant ATS scoring and improvement suggestions</p>
        </div>
      )}
    </div>
  );
};

export default ATSScoreDisplay;
