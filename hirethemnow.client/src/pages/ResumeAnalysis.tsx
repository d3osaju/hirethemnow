import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  Target,
  Sparkles,
  ArrowUp,
  Upload,
  RefreshCw,
  Download
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
  status: string;
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
  const [uploadLoading, setUploadLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [resumeData, setResumeData] = useState<{ hasResume: boolean; status: string; resumeUrl?: string } | null>(null);
  const [resumeCheckLoading, setResumeCheckLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalysis();
      checkResumeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkResumeStatus = async () => {
    try {
      setResumeCheckLoading(true);
      const response = await resumeAPI.getResumeStatus();
      if (response.success) {
        setResumeData(response.data);
      } else {
        setResumeData({ hasResume: false, status: 'none' });
      }
    } catch (error) {
      console.error('Failed to check resume status:', error);
      setResumeData({ hasResume: false, status: 'none' });
    } finally {
      setResumeCheckLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/AIAgent/resume-analysis/${user.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setAnalysis(data.data);
      } else if (response.status === 404) {
        // User hasn't uploaded a resume yet - this is not an error
        setError(null);
        setAnalysis(null);
      } else {
        setError('Failed to load resume analysis. Please try again.');
      }
    } catch (err) {
      setError('Failed to load resume analysis. Please try again.');
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      const response = await resumeAPI.uploadResume(file);
      if (response.success) {
        await checkResumeStatus();
        toast.success('Resume uploaded successfully! You can now analyze it.');
      } else {
        toast.error('Upload failed: ' + response.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!user) return;

    try {
      setAnalyzeLoading(true);
      const response = await fetch('/api/AIAgent/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Resume analysis started! This may take 30-60 seconds.');
        // Refresh the analysis to show processing state
        await fetchAnalysis();
      } else {
        toast.error('Failed to start analysis: ' + data.message);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to start analysis. Please try again.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const result = await resumeAPI.downloadResume();
      if (!result.success) {
        if (result.needsUpload) {
          toast.error('No resume found. Please upload a resume first.');
        } else {
          toast.error('Failed to download resume: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resume. Please try again.');
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

  // Show processing state
  if (analysis && analysis.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="relative">
              <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles className="w-12 h-12 text-blue-600" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="animate-spin rounded-full h-28 w-28 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Analyzing Your Resume...</h2>
            <p className="text-gray-600 mb-2 text-lg">
              Our AI is working its magic! 🪄
            </p>
            <p className="text-sm text-gray-500 mb-6 max-w-2xl mx-auto">
              We're analyzing your resume with Amazon Bedrock Nova Pro to provide comprehensive ATS scoring,
              identify strengths, suggest improvements, and analyze keywords.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6 max-w-xl mx-auto">
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    You'll receive an email when analysis is complete!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Analysis typically takes 30-60 seconds. Feel free to navigate away - we'll notify you at {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchAnalysis}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Check Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state only if there's an actual error (not just missing analysis)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Analysis</h2>
            <p className="text-gray-600 mb-8">
              {error}
            </p>
            <button
              onClick={fetchAnalysis}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome state if no analysis exists
  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Resume Analysis</h2>
              <p className="text-gray-600 mb-2 text-lg">
                Get AI-powered insights to optimize your resume for ATS systems
              </p>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                Our AI analyzes your resume and provides comprehensive ATS scoring, identifies strengths,
                suggests improvements, and analyzes keywords using Amazon Bedrock Nova Pro.
              </p>
            </div>

            {resumeCheckLoading ? (
              <div className="border border-gray-200 rounded-lg p-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-64"></div>
                </div>
              </div>
            ) : resumeData?.hasResume ? (
              // Resume exists, show analyze button
              <div className="space-y-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Resume Ready for Analysis</h3>
                        <p className="text-sm text-gray-600">Your resume has been uploaded successfully</p>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadResume}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white border border-green-300 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            await handleFileUpload(file);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadLoading}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Update Resume
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-bold mb-3">Ready to Analyze?</h3>
                  <p className="mb-6 opacity-90">
                    Start your AI-powered resume analysis to discover how to optimize your resume for ATS systems
                  </p>
                  <button
                    onClick={handleAnalyzeResume}
                    disabled={analyzeLoading}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {analyzeLoading ? (
                      <>
                        <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                        Starting Analysis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 mr-3" />
                        Analyze Resume Now
                      </>
                    )}
                  </button>
                  <p className="text-sm mt-4 opacity-75">Analysis typically takes 30-60 seconds</p>
                </div>
              </div>
            ) : (
              // No resume uploaded, show upload section
              <div className="space-y-6">
                <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                      Upload your resume to get started with AI-powered analysis. Supported formats: PDF, DOC, DOCX
                    </p>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            await handleFileUpload(file);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadLoading}
                      className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mr-3" />
                          Choose File to Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        Already uploaded to your profile?
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        If you've uploaded your resume in your profile settings, it will automatically appear here.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => window.location.href = '/dashboard/profile'}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Go to Profile
                        </button>
                        <button
                          onClick={() => {
                            checkResumeStatus();
                            fetchAnalysis();
                          }}
                          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>ATS Score:</strong> Overall score and detailed breakdown across key categories</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Strengths Analysis:</strong> Identify what's working well in your resume</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Priority Improvements:</strong> Actionable suggestions to boost your score</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Keyword Analysis:</strong> Found and missing keywords for better visibility</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
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
            <div className="flex gap-2">
              <button
                onClick={fetchAnalysis}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleAnalyzeResume}
                disabled={analyzeLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzeLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Re-Analyze
                  </>
                )}
              </button>
            </div>
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
