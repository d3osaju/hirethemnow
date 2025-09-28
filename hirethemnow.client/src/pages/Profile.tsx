import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';
import { User, Mail, Code, FileText, Camera, Save, Upload, CheckCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    skills: user?.skills || [],
  });
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);

  useEffect(() => {
    // Temporarily disable resume loading until backend is deployed
    // loadResumeData();
    setResumeLoading(false);
    // Mock resume data for now
    setResumeData({
      id: '1',
      userId: 'user1',
      resumeFileName: 'resume.pdf',
      resumeFilePath: 'path/to/resume.pdf',
      analysisStatus: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }, []);

  const loadResumeData = async () => {
    try {
      setResumeLoading(true);
      const response = await resumeAPI.getResumeAnalysis();

      if (response.success && response.data) {
        // Check if response.data is a ResumeAnalysis object or a status object
        if ('id' in response.data && 'userId' in response.data) {
          setResumeData(response.data as ResumeAnalysis);
        } else {
          setResumeData(null);
        }
      } else {
        setResumeData(null);
      }
    } catch {
      setResumeData(null);
    } finally {
      setResumeLoading(false);
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
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success-100 text-success-800 border border-success-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Uploaded
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-warning-100 text-warning-800 border border-warning-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      case 'analyzed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Analyzed
          </span>
        );
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleSave = () => {
    // TODO: Save profile data to backend
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      skills: user?.skills || [],
    });
    setEditing(false);
  };

  const handleDownloadResume = async () => {
    try {
      await resumeAPI.downloadResume();
    } catch {
      alert('Failed to download resume. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.role === 'candidate' ? 'Job Seeker' : 'Employer'}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1 flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{user?.role === 'candidate' ? 'Job Seeker' : 'Employer'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Skills & Expertise
              </h3>
              {editing ? (
                <div>
                  <input
                    type="text"
                    placeholder="Enter skills separated by commas"
                    value={formData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate skills with commas (e.g., JavaScript, React, Node.js)
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user?.skills && user.skills.length > 0 ? (
                    user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Resume */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Resume
              </h3>

              {resumeLoading ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="animate-pulse flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : resumeData ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{resumeData.resumeFileName}</h4>
                        <p className="text-xs text-gray-500">Uploaded on {formatDate(resumeData.createdAt)}</p>
                        {resumeData.analysisStatus && (
                          <div className="mt-1">
                            {getStatusBadge(resumeData.analysisStatus)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDownloadResume}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.doc,.docx';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              try {
                                const result = await resumeAPI.uploadResume(file);
                                if (result.success) {
                                  await loadResumeData(); // Reload the resume data
                                } else {
                                  alert('Upload failed: ' + result.message);
                                }
                              } catch (error) {
                                alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                              }
                            }
                          };
                          input.click();
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors duration-200"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-warning-300 bg-warning-50 rounded-lg p-6">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-warning-600 mb-3" />
                    <h4 className="text-sm font-medium text-warning-800 mb-2">Resume Required</h4>
                    <p className="text-xs text-warning-700 mb-4">
                      Upload your resume to start receiving job opportunities and enable automated applications.
                    </p>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            try {
                              const result = await resumeAPI.uploadResume(file);
                              if (result.success) {
                                await loadResumeData(); // Reload the resume data
                              } else {
                                alert('Upload failed: ' + result.message);
                              }
                            } catch (error) {
                              alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            }
                          }
                        };
                        input.click();
                      }}
                      className="inline-flex items-center px-4 py-2 bg-warning-600 text-white text-sm font-medium rounded-lg hover:bg-warning-700 transition-colors duration-200"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;