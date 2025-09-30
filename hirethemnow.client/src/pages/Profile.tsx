import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resumeAPI, authAPI, emailPreferencesAPI, industriesAPI } from '../services/api';
import { User, Mail, Code, Camera, Save, FileText, Upload, Download, RefreshCw, CheckCircle, AlertCircle, Bell, X } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    title: user?.title || '',
    industry: user?.industry || '',
    experience: user?.experience || '',
  });
  const [resumeData, setResumeData] = useState<{ hasResume: boolean; status: string; resumeUrl?: string } | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState({
    weeklyPerformanceReport: false,
    marketingEmails: false,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [industries, setIndustries] = useState<Array<{ id: number; name: string; skills: Array<{ id: number; name: string; industryId: number }> }>>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: number; name: string; industryId: number }>>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  useEffect(() => {
    // Only load resume data if user is authenticated and has a token
    const token = localStorage.getItem('token');
    if (user && token) {
      loadResumeData();
      loadEmailPreferences();
      loadIndustries();
    } else {
      setResumeLoading(false);
      setResumeData({ hasResume: false, status: 'none' });
      setPreferencesLoading(false);
      setIndustriesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Initialize selected industry when industries are loaded and editing starts
    if (editing && industries.length > 0 && user?.industry) {
      const industry = industries.find(i => i.name === user.industry);
      if (industry) {
        setSelectedIndustryId(industry.id);
        setAvailableSkills(industry.skills);
      }
    }
  }, [editing, industries, user?.industry]);

  const loadIndustries = async () => {
    try {
      setIndustriesLoading(true);
      const response = await industriesAPI.getIndustries();
      if (response.success) {
        setIndustries(response.data);
      }
    } catch (error) {
      console.error('Failed to load industries:', error);
    } finally {
      setIndustriesLoading(false);
    }
  };

  const handleIndustryChange = (industryId: number) => {
    setSelectedIndustryId(industryId);
    const selectedIndustry = industries.find(i => i.id === industryId);
    if (selectedIndustry) {
      setAvailableSkills(selectedIndustry.skills);
      setFormData(prev => ({ ...prev, industry: selectedIndustry.name }));
    }
  };

  const handleSkillToggle = (skillName: string) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skillName)
        ? prev.skills.filter(s => s !== skillName)
        : [...prev.skills, skillName];
      return { ...prev, skills };
    });
  };

  const loadResumeData = async () => {
    try {
      setResumeLoading(true);
      const response = await resumeAPI.getResumeStatus();
      if (response.success) {
        setResumeData(response.data);
      } else {
        setResumeData({ hasResume: false, status: 'none' });
      }
    } catch (error) {
      console.error('Failed to load resume data:', error);
      // Don't set resume data if it's an auth error - let the interceptor handle it
      if (error && typeof error === 'object' && 'response' in error &&
          (error as { response?: { status?: number } }).response?.status !== 401) {
        setResumeData({ hasResume: false, status: 'none' });
      }
    } finally {
      setResumeLoading(false);
    }
  };

  const loadEmailPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await emailPreferencesAPI.getPreferences();
      if (response.success) {
        setEmailPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handlePreferenceToggle = async (preference: 'weeklyPerformanceReport' | 'marketingEmails') => {
    const newValue = !emailPreferences[preference];
    setEmailPreferences(prev => ({ ...prev, [preference]: newValue }));

    try {
      await emailPreferencesAPI.updatePreferences({ [preference]: newValue });
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setEmailPreferences(prev => ({ ...prev, [preference]: !newValue }));
      alert('Failed to update preference. Please try again.');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      const response = await resumeAPI.uploadResume(file);
      if (response.success) {
        await loadResumeData(); // Reload resume data
        alert('Resume uploaded successfully!');
      } else {
        alert('Upload failed: ' + response.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const result = await resumeAPI.downloadResume();
      if (!result.success) {
        if (result.needsUpload) {
          alert('No resume found. Please upload a resume first.');
        } else {
          alert('Failed to download resume: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'uploaded':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Uploaded
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      default:
        return null;
    }
  };




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills,
        title: formData.title,
        industry: formData.industry,
        experience: formData.experience
      });

      if (response.success) {
        // Update the user context with new data
        // The auth context should be updated with the new user data
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      title: user?.title || '',
      industry: user?.industry || '',
      experience: user?.experience || '',
    });
    setSelectedIndustryId(null);
    setAvailableSkills([]);
    setEditing(false);
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State/Country"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.location || 'Not provided'}</p>
                  )}
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

            {/* Bio */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                About
              </h3>
              {editing ? (
                <div>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Tell us about yourself, your experience, and what you're looking for..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Write a brief description about yourself and your professional background.
                  </p>
                </div>
              ) : (
                <div>
                  {user?.bio ? (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{user.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No bio added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Current Title
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Software Engineer"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.title || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  {editing ? (
                    industriesLoading ? (
                      <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                        <span className="text-gray-400">Loading industries...</span>
                      </div>
                    ) : (
                      <select
                        id="industry"
                        name="industry"
                        value={selectedIndustryId || ''}
                        onChange={(e) => handleIndustryChange(Number(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Industry</option>
                        {industries.map((industry) => (
                          <option key={industry.id} value={industry.id}>
                            {industry.name}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.industry || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  {editing ? (
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Experience Level</option>
                      <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                      <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                      <option value="Senior Level (6-10 years)">Senior Level (6-10 years)</option>
                      <option value="Executive Level (10+ years)">Executive Level (10+ years)</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.experience || 'Not provided'}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Expertise
                </label>
                {editing ? (
                  <div>
                    {selectedIndustryId && availableSkills.length > 0 ? (
                      <div>
                        <div className="mb-3 p-3 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {availableSkills.map((skill) => (
                              <label
                                key={skill.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.skills.includes(skill.name)}
                                  onChange={() => handleSkillToggle(skill.name)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{skill.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {formData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => handleSkillToggle(skill)}
                                  className="ml-1 hover:text-blue-900"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-3 border border-gray-300 rounded-md bg-gray-50">
                        Please select an industry first to choose skills
                      </div>
                    )}
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
              ) : resumeData?.hasResume ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Resume Uploaded</h4>
                        <p className="text-xs text-gray-500">Click download to view your resume</p>
                        {resumeData.status && (
                          <div className="mt-1">
                            {getStatusBadge(resumeData.status)}
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
                              await handleFileUpload(file);
                            }
                          };
                          input.click();
                        }}
                        disabled={uploadLoading}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50"
                      >
                        {uploadLoading ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        {uploadLoading ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-lg p-6">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-3" />
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Resume Required</h4>
                    <p className="text-xs text-yellow-700 mb-4">
                      Upload your resume to enhance your profile and job opportunities.
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Resume
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Preferences */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Email Preferences
              </h3>

              {preferencesLoading ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Weekly Performance Report</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">Weekly summary of your job search performance</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handlePreferenceToggle('weeklyPerformanceReport')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              emailPreferences.weeklyPerformanceReport ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                emailPreferences.weeklyPerformanceReport ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Marketing & Promotional Emails</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">Tips, features, and promotional content</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handlePreferenceToggle('marketingEmails')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              emailPreferences.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                emailPreferences.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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