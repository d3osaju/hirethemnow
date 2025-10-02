import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Target,
  Sparkles,
  ArrowUp,
  Upload
} from 'lucide-react';

interface ATSScore {
  overall: number;
  breakdown: {
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
    achievements: number;
  };
}

interface ImprovementSuggestion {
  category: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
}

interface ResumeAnalysis {
  userId: string;
  atsScore: ATSScore;
  strengths: string[];
  weaknesses: string[];
  improvements: ImprovementSuggestion[];
  keywords: {
    found: string[];
    missing: string[];
    density: number;
  };
  processedAt: string;
  s3Url?: string;
}

const ResumeAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/AIAgent/resume-analysis/${user.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setAnalysis(data.data);
      } else {
        setError('No resume analysis found. Please upload your resume first.');
      }
    } catch (err) {
      setError('Failed to load resume analysis');
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your resume analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Resume Analysis Found</h2>
            <p className="text-gray-600 mb-6">{error || 'Upload your resume to get started with AI-powered ATS analysis.'}</p>
            <button
              onClick={() => window.location.href = '/profile'}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedImprovements = [...analysis.improvements].sort((a, b) => b.priority - a.priority);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-8 h-8 mr-3 text-blue-600" />
                Resume Analysis
              </h1>
              <p className="mt-2 text-gray-600">
                AI-powered insights to optimize your resume for ATS systems
              </p>
            </div>
            <button
              onClick={fetchAnalysis}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Refresh Analysis
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Last analyzed: {new Date(analysis.processedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-6">Overall ATS Score</h2>
            <div className="relative inline-block">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${analysis.atsScore.overall * 4.4} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-5xl font-bold">{analysis.atsScore.overall}</div>
                  <div className="text-sm opacity-90">out of 100</div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-lg opacity-90">
              {analysis.atsScore.overall >= 80 && 'Excellent! Your resume is well-optimized for ATS systems.'}
              {analysis.atsScore.overall >= 60 && analysis.atsScore.overall < 80 && 'Good start! A few improvements can boost your score.'}
              {analysis.atsScore.overall < 60 && 'Needs improvement. Follow the suggestions below to optimize your resume.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              Score Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(analysis.atsScore.breakdown).map(([category, score]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                    <span className={`text-sm font-semibold ${getScoreColor(score)}`}>{score}/100</span>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              Strengths
            </h3>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-3">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No strengths identified yet.</p>
            )}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <ArrowUp className="w-6 h-6 mr-2 text-orange-600" />
            Priority Improvements
          </h3>
          {sortedImprovements.length > 0 ? (
            <div className="space-y-4">
              {sortedImprovements.map((improvement, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{improvement.category}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getImpactColor(improvement.impact)}`}>
                          {improvement.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{improvement.issue}</p>
                      <p className="text-sm text-blue-600 font-medium">
                        💡 {improvement.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No improvements suggested. Your resume looks great!</p>
          )}
        </div>

        {/* Keywords Analysis */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Keywords Found</h3>
            {analysis.keywords.found.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.found.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No keywords identified.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Missing Keywords</h3>
            {analysis.keywords.missing.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.missing.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No missing keywords. Great job!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
