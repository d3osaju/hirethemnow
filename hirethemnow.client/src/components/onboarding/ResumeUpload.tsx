import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Star, Zap, RefreshCw } from 'lucide-react';
import { resumeAPI } from '../../services/api';
import type { ResumeAnalysis } from '../../types';

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingResume, setExistingResume] = useState<ResumeAnalysis | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    checkExistingResume();
  }, []);

  const checkExistingResume = async () => {
    try {
      setLoadingExisting(true);
      console.log('🔍 [ONBOARDING] Checking for existing resume...');
      const response = await resumeAPI.getResumeAnalysis();
      console.log('📄 [ONBOARDING] Resume API Response:', response);

      if (response.success && response.data) {
        console.log('✅ [ONBOARDING] Existing resume found:', response.data);
        setExistingResume(response.data);
        setIsUpdate(true);
      } else {
        console.log('❌ [ONBOARDING] No existing resume found');
        setExistingResume(null);
        setIsUpdate(false);
      }
    } catch (error) {
      console.error('💥 [ONBOARDING] Error checking existing resume:', error);
      setExistingResume(null);
      setIsUpdate(false);
    } finally {
      setLoadingExisting(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('DEBUG: File selection triggered', event.target.files);
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('DEBUG: File selected:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type);

      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      console.log('DEBUG: File extension:', fileExtension);

      if (!allowedTypes.includes(fileExtension)) {
        console.log('DEBUG: File type validation failed');
        setErrorMessage('Please upload a PDF or Word document (.pdf, .doc, .docx)');
        setUploadStatus('error');
        return;
      }

      // Validate file size (2MB max)
      if (selectedFile.size > 2 * 1024 * 1024) {
        console.log('DEBUG: File size validation failed:', selectedFile.size);
        setErrorMessage('File size must be less than 2MB');
        setUploadStatus('error');
        return;
      }

      console.log('DEBUG: File validation passed, setting file state');
      setFile(selectedFile);
      setUploadStatus('idle');
      setErrorMessage('');
    } else {
      console.log('DEBUG: No file selected');
    }
  };

  const handleUpload = async () => {
    console.log('DEBUG: Upload button clicked, file state:', file);
    if (!file) {
      console.log('DEBUG: No file to upload, returning early');
      return;
    }

    console.log('DEBUG: Starting upload process');
    setUploading(true);
    setUploadStatus('uploading');

    try {
      console.log('DEBUG: Calling resumeAPI.uploadResume with file:', file.name);
      const result = await resumeAPI.uploadResume(file);
      console.log('DEBUG: Upload API response:', result);

      if (result.success) {
        console.log('DEBUG: Upload successful');
        setUploadStatus('success');
        setTimeout(() => {
          onUploadComplete();
        }, 2000);
      } else {
        console.log('DEBUG: Upload failed:', result.message);
        setErrorMessage(result.message || 'Upload failed');
        setUploadStatus('error');
      }
    } catch (error: unknown) {
      console.log('DEBUG: Upload error caught:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Network error. Please try again.');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Upload className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading and analyzing your resume...';
      case 'success':
        return 'Success! Your resume has been uploaded and analysis started. Redirecting to your mailbox...';
      case 'error':
        return errorMessage;
      default:
        return 'Upload your resume to get started with automated job applications';
    }
  };

  console.log('DEBUG: Component render - file:', file?.name, 'uploadStatus:', uploadStatus);

  if (loadingExisting) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-6">
            <Loader className="h-8 w-8 text-gray-700 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Checking your existing resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-6">
          {isUpdate ? <RefreshCw className="h-8 w-8 text-gray-700" /> : <Zap className="h-8 w-8 text-gray-700" />}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {isUpdate ? 'Update Your Resume' : 'Upload Your Resume'}
        </h2>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          {isUpdate
            ? 'Upload a new version of your resume to update your job hunting campaign'
            : 'Our AI will analyze your resume and automatically launch a personalized job hunting campaign'
          }
        </p>
      </div>

      {/* Existing Resume Info */}
      {isUpdate && existingResume && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Current Resume</h3>
              <p className="text-lg font-semibold text-blue-800">{existingResume.resumeFileName}</p>
              <p className="text-sm text-blue-600">Uploaded on {formatDate(existingResume.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gradient-to-br from-gray-50 to-white hover:border-gray-400 transition-all duration-300">
        {!file ? (
          <label htmlFor="resume-upload" className="cursor-pointer block">
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-10 w-10 text-gray-700" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">Drop your resume here or click to browse</p>
                <p className="text-gray-500">Supports PDF, DOC, or DOCX up to 2MB</p>
              </div>
            </div>
            <input
              id="resume-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center">
              <FileText className="h-10 w-10 text-success-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-jobpilot-navy mb-2">{file.name}</p>
              <p className="text-neutral-500 mb-4">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {uploadStatus !== 'success' && (
              <button
                onClick={() => {
                  console.log('DEBUG: Choose different file clicked');
                  setFile(null);
                  setUploadStatus('idle');
                  setErrorMessage('');
                }}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                Choose different file
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-8 flex items-center justify-center space-x-3">
        {getStatusIcon()}
        <p className={`text-lg font-medium ${
          uploadStatus === 'error' ? 'text-error-600' :
          uploadStatus === 'success' ? 'text-success-600' :
          uploadStatus === 'uploading' ? 'text-gray-700' :
          'text-gray-600'
        }`}>
          {getStatusMessage()}
        </p>
      </div>

      {/* Upload Button */}
      {file && uploadStatus !== 'success' && (
        <div className="mt-8">
          <button
            onClick={(e) => {
              console.log('DEBUG: Upload button click event:', e);
              handleUpload();
            }}
            disabled={uploading}
            className={`w-full flex items-center justify-center py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-200 ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gray-800 text-white hover:bg-gray-900 hover:shadow-button-hover transform hover:-translate-y-0.5'
            }`}
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 mr-3 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                {isUpdate ? <RefreshCw className="w-5 h-5 mr-3" /> : <Zap className="w-5 h-5 mr-3" />}
                {isUpdate ? 'Update Resume' : 'Start AI Job Hunt'}
              </>
            )}
          </button>
        </div>
      )}

      {/* What Happens Next */}
      {uploadStatus === 'idle' && (
        <div className="mt-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-primary-900">What happens next?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm text-primary-800 font-medium">AI analyzes your resume and extracts key skills</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm text-primary-800 font-medium">We find relevant HR contacts in your field</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm text-primary-800 font-medium">Personalized emails are sent automatically</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p className="text-sm text-primary-800 font-medium">Track all responses in your smart mailbox</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;