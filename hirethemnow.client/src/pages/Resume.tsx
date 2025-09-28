import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';
import { FileText, Upload, Download, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';

const Resume: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await resumeAPI.getResumeAnalysis();
      if (response.success) {
        setResumeData(response.data || null);
      } else {
        setError(response.message || 'Failed to load resume data');
      }
    } catch (err) {
      console.error('Error loading resume data:', err);
      setError('No resume found. Please upload your resume to get started.');
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-jobpilot-navy mb-3">Resume</h1>
            <p className="text-lg text-neutral-600">Manage your resume and view analysis</p>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-neutral-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-jobpilot-navy mb-2">No Resume Uploaded</h3>
            <p className="text-neutral-500 max-w-sm mx-auto mb-6">
              Upload your resume to start getting personalized job recommendations and automated applications.
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-jobpilot-navy mb-3">Resume</h1>
          <p className="text-lg text-neutral-600">Manage your resume and view analysis</p>
        </div>

        {/* Resume Overview Card */}
        <div className="bg-white rounded-xl shadow-card border border-neutral-100 mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-jobpilot-navy">{resumeData.resumeFileName}</h2>
                  <p className="text-neutral-500 mt-1">
                    Uploaded on {formatDate(resumeData.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {getStatusBadge(resumeData.analysisStatus)}
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors duration-200">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>

            {/* File Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <FileText className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">File Name</p>
                    <p className="text-base font-semibold text-jobpilot-navy truncate">
                      {resumeData.resumeFileName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Upload Date</p>
                    <p className="text-base font-semibold text-jobpilot-navy">
                      {formatDate(resumeData.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <User className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Status</p>
                    <p className="text-base font-semibold text-jobpilot-navy capitalize">
                      {resumeData.analysisStatus || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {resumeData.skills && (
          <div className="bg-white rounded-xl shadow-card border border-neutral-100 mb-8">
            <div className="p-8">
              <h3 className="text-xl font-bold text-jobpilot-navy mb-6">Skills Analysis</h3>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.split(',').map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {resumeData.summary && (
          <div className="bg-white rounded-xl shadow-card border border-neutral-100 mb-8">
            <div className="p-8">
              <h3 className="text-xl font-bold text-jobpilot-navy mb-4">Professional Summary</h3>
              <p className="text-neutral-700 leading-relaxed">{resumeData.summary}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-card border border-neutral-100">
          <div className="p-8">
            <h3 className="text-xl font-bold text-jobpilot-navy mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload New Resume
              </button>
              <button className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors duration-200">
                <Download className="w-5 h-5 mr-2" />
                Download Current Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;