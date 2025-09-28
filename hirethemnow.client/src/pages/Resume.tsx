import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';
import { FileText, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const Resume: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumeAnalysis();
      if (response.success) {
        setResumeData(response.data || null);
      } else {
        setResumeData(null);
      }
    } catch {
      setResumeData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'uploaded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800 border border-success-200">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Uploaded
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-800 border border-warning-200">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            Processing
          </span>
        );
      case 'analyzed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-200 rounded-lg w-1/4 mb-8"></div>
            <div className="bg-white rounded-xl p-8 shadow-card">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2 mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-jobpilot-navy mb-3">Resume</h1>
            <p className="text-lg text-neutral-600">Manage your resume</p>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-neutral-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-jobpilot-navy mb-2">No Resume Found</h3>
            <p className="text-neutral-500 mb-6">
              Upload your resume to start receiving job opportunities.
            </p>
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-jobpilot-navy mb-3">Resume</h1>
          <p className="text-lg text-neutral-600">Manage your resume</p>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-neutral-100">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-jobpilot-navy">{resumeData.resumeFileName}</h2>
                  <p className="text-neutral-500">
                    Uploaded on {formatDate(resumeData.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(resumeData.analysisStatus)}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Update Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;