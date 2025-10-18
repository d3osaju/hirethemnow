import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resumeAnalysisAPI, resumeAPI } from '../services/api';
import { ensureSectionFeedback, ensureNumber } from '../utils/dataHelpers';
import type { AnalysisStatus, ResumeAnalysisResult, SectionFeedback } from '../types';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Loader2,
  AlertTriangle,
  BarChart3,
  Download
} from 'lucide-react';

// Component imports (to be created)
import AnalysisStatusBanner from '../components/ResumeAnalysis/AnalysisStatusBanner';
import OverallScoreCard from '../components/ResumeAnalysis/OverallScoreCard';
import ScoreBreakdown from '../components/ResumeAnalysis/ScoreBreakdown';
import StrengthsSection from '../components/ResumeAnalysis/StrengthsSection';
import WeaknessesSection from '../components/ResumeAnalysis/WeaknessesSection';
import RecommendationsSection from '../components/ResumeAnalysis/RecommendationsSection';
import KeywordsAnalysis from '../components/ResumeAnalysis/KeywordsAnalysis';
import ReadabilitySection from '../components/ResumeAnalysis/ReadabilitySection';
import SectionDetails from '../components/ResumeAnalysis/SectionDetails';

const ResumeAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeStatus, setResumeStatus] = useState<{ hasResume: boolean; status: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  // Polling interval reference
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await resumeAnalysisAPI.getStatus();
      if (response.success) {
        setStatus(response.data);
        setError(null);
        return response.data;
      } else {
        // No analysis found - this is not an error
        setStatus(null);
        setError(null);
        return null;
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        // No analysis found - this is not an error
        setStatus(null);
        setError(null);
        return null;
      } else {
        console.error('Error fetching analysis status:', err);
        setError('Failed to load analysis status');
        return null;
      }
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const response = await resumeAnalysisAPI.getResults();
      if (response.success) {
        setAnalysis(response.data);
        setError(null);
        return response.data;
      } else {
        setAnalysis(null);
        return null;
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setAnalysis(null);
        return null;
      } else if (error.response?.status === 202) {
        // Still processing - this is expected
        setAnalysis(null);
        return null;
      } else {
        console.error('Error fetching analysis results:', err);
        setError('Failed to load analysis results');
        return null;
      }
    }
  }, []);

  const checkResumeStatus = useCallback(async () => {
    try {
      const response = await resumeAPI.getResumeStatus();
      if (response.success) {
        setResumeStatus(response.data);
      } else {
        setResumeStatus({ hasResume: false, status: 'none' });
      }
    } catch (error) {
      console.error('Failed to check resume status:', error);
      setResumeStatus({ hasResume: false, status: 'none' });
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      const currentStatus = await fetchStatus();
      
      if (currentStatus?.status === 'completed') {
        await fetchResults();
        clearInterval(interval);
        setPollingInterval(null);
      } else if (currentStatus?.status === 'failed') {
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  }, [fetchStatus, fetchResults, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;

      setLoading(true);
      
      // Fetch initial data
      await checkResumeStatus();
      const currentStatus = await fetchStatus();
      
      if (currentStatus?.status === 'completed') {
        await fetchResults();
      } else if (currentStatus?.status === 'waiting_for_parsing' || currentStatus?.status === 'processing') {
        startPolling();
      }
      
      setLoading(false);
    };

    initializeData();

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [user, checkResumeStatus, fetchStatus, fetchResults, startPolling, stopPolling]);

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      const response = await resumeAPI.uploadResume(file);
      if (response.success) {
        await checkResumeStatus();
        await fetchStatus();
        toast.success('Resume uploaded successfully! Analysis will begin automatically.');
        
        // Start polling for the new analysis
        startPolling();
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

  const handleRetry = async () => {
    try {
      setRetryLoading(true);
      const response = await resumeAnalysisAPI.retry();
      if (response.success) {
        toast.success('Analysis restarted successfully!');
        await fetchStatus();
        startPolling();
      } else {
        toast.error('Failed to retry analysis: ' + response.message);
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry analysis. Please try again.');
    } finally {
      setRetryLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your resume analysis...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Analysis</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no resume state
  if (!resumeStatus?.hasResume) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">ATS Resume Analysis</h2>
              <p className="text-gray-600 mb-2 text-lg">
                Get AI-powered insights to optimize your resume for ATS systems
              </p>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                Our AI analyzes your resume and provides comprehensive ATS scoring, identifies strengths,
                suggests improvements, and analyzes keywords using Amazon Bedrock Nova Pro.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8">
                <div className="text-center">
                  <Upload className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Upload your resume to get started with AI-powered analysis. Supported format: PDF only
                  </p>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf';
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
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mr-3" />
                        Choose PDF File to Upload
                      </>
                    )}
                  </button>
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
          </div>
        </div>
      </div>
    );
  }

  // Show processing states
  if (status?.status === 'waiting_for_parsing' || status?.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <AnalysisStatusBanner 
            status={status.status}
            message={status.message}
            userEmail={user?.email}
          />
        </div>
      </div>
    );
  }

  // Show failed state
  if (status?.status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Analysis Failed</h2>
            <p className="text-gray-600 mb-8">
              {status.errorMessage || 'An error occurred while analyzing your resume. Please try again.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                disabled={retryLoading}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {retryLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Retry Analysis
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      await handleFileUpload(file);
                    }
                  };
                  input.click();
                }}
                disabled={uploadLoading}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload New Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show completed analysis results
  if (status?.status === 'completed' && analysis) {
    // Ensure sectionFeedback is properly formatted and convert to array
    const safeSectionFeedback = ensureSectionFeedback(analysis.sectionFeedback);
    const sectionFeedback: SectionFeedback[] = Object.entries(safeSectionFeedback).map(([sectionName, feedback]) => ({
      sectionName,
      score: feedback.score,
      issues: feedback.issues,
      suggestions: feedback.suggestions
    }));

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
                  Resume Analysis Results
                </h1>
                <p className="mt-2 text-gray-600">
                  AI-powered insights to optimize your resume for ATS systems
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadResume}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={handleRetry}
                  disabled={retryLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm disabled:opacity-50"
                >
                  {retryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
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
          <OverallScoreCard score={ensureNumber(analysis.atsOverallScore, 0)} />

          {/* Score Breakdown and Strengths */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ScoreBreakdown 
              scores={{
                formatting: ensureNumber(analysis.atsFormattingScore, 0),
                keywords: ensureNumber(analysis.atsKeywordsScore, 0),
                experience: ensureNumber(analysis.atsExperienceScore, 0),
                education: ensureNumber(analysis.atsEducationScore, 0),
                skills: ensureNumber(analysis.atsSkillsScore, 0),
                achievements: ensureNumber(analysis.atsAchievementsScore, 0)
              }}
            />
            <StrengthsSection strengths={analysis.strengths} />
          </div>

          {/* Weaknesses and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <WeaknessesSection weaknesses={analysis.weaknesses} />
            <RecommendationsSection recommendations={analysis.recommendations} />
          </div>

          {/* Keywords and Readability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <KeywordsAnalysis 
              keywordsFound={analysis.keywordsFound}
              keywordsMissing={analysis.keywordsMissing}
              keywordDensity={analysis.keywordDensity}
            />
            <ReadabilitySection 
              score={analysis.readabilityScore}
              issues={analysis.readabilityIssues}
            />
          </div>

          {/* Section Details */}
          {sectionFeedback.length > 0 && (
            <SectionDetails sections={sectionFeedback} />
          )}
        </div>
      </div>
    );
  }

  // Default state - should not reach here
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Analysis Available</h2>
          <p className="text-gray-600 mb-8">
            Upload a resume to get started with AI-powered analysis.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisPage;