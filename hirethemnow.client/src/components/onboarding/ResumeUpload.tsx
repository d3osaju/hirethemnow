import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

      if (!allowedTypes.includes(fileExtension)) {
        setErrorMessage('Please upload a PDF or Word document (.pdf, .doc, .docx)');
        setUploadStatus('error');
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB');
        setUploadStatus('error');
        return;
      }

      setFile(selectedFile);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          onUploadComplete();
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Upload failed');
        setUploadStatus('error');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
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

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
        <p className="text-gray-600">
          We'll analyze your resume and automatically start sending it to relevant HR contacts
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {!file ? (
          <label htmlFor="resume-upload" className="cursor-pointer">
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">Click to upload resume</p>
                <p className="text-sm text-gray-500">PDF, DOC, or DOCX up to 10MB</p>
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
          <div className="space-y-4">
            <FileText className="mx-auto h-12 w-12 text-blue-600" />
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {uploadStatus !== 'success' && (
              <button
                onClick={() => {
                  setFile(null);
                  setUploadStatus('idle');
                  setErrorMessage('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Choose different file
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-6 flex items-center justify-center space-x-2">
        {getStatusIcon()}
        <p className={`text-sm ${
          uploadStatus === 'error' ? 'text-red-600' :
          uploadStatus === 'success' ? 'text-green-600' :
          uploadStatus === 'uploading' ? 'text-blue-600' :
          'text-gray-600'
        }`}>
          {getStatusMessage()}
        </p>
      </div>

      {/* Upload Button */}
      {file && uploadStatus !== 'success' && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {uploading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Start Job Hunt'
            )}
          </button>
        </div>
      )}

      {/* What Happens Next */}
      {uploadStatus === 'idle' && (
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI analyzes your resume and extracts key skills</li>
            <li>• We find relevant HR contacts in your field</li>
            <li>• Personalized emails are sent automatically</li>
            <li>• You'll see all responses in your mailbox</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;