import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { JobOpportunity, UpdateContactRequest } from '../../types';

interface ContactEditFormProps {
  contact: JobOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: UpdateContactRequest) => Promise<void>;
}

interface FormErrors {
  jobTitle?: string;
  company?: string;
  location?: string;
  emails?: string;
  salary?: string;
  link?: string;
}

const ContactEditForm: React.FC<ContactEditFormProps> = ({
  contact,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<UpdateContactRequest>({
    jobTitle: '',
    company: '',
    location: '',
    emails: '',
    emailType: 'general',
    isRemote: false,
    salary: '',
    link: '',
    snippet: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        jobTitle: contact.jobTitle,
        company: contact.company,
        location: contact.location,
        emails: contact.emails,
        emailType: contact.emailType,
        isRemote: contact.isRemote,
        salary: contact.salary,
        link: contact.link,
        snippet: contact.snippet
      });
      setErrors({});
    }
  }, [contact]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (formData.emails && formData.emails.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = formData.emails.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => email && !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        newErrors.emails = 'Please enter valid email addresses separated by commas';
      }
    }

    if (formData.link && formData.link.trim()) {
      try {
        new URL(formData.link);
      } catch {
        newErrors.link = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contact || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(contact.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
      // Handle error - could show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Contact</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Senior Software Engineer"
                />
                {errors.jobTitle && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.jobTitle}
                  </div>
                )}
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., TechCorp Inc."
                />
                {errors.company && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.company}
                  </div>
                )}
              </div>

              {/* Location and Remote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRemote"
                    name="isRemote"
                    checked={formData.isRemote}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRemote" className="ml-2 block text-sm text-gray-700">
                    Remote position
                  </label>
                </div>
              </div>

              {/* Email and Email Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Addresses
                  </label>
                  <input
                    type="text"
                    id="emails"
                    name="emails"
                    value={formData.emails || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.emails ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="email1@company.com, email2@company.com"
                  />
                  {errors.emails && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.emails}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="emailType" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Type
                  </label>
                  <select
                    id="emailType"
                    name="emailType"
                    value={formData.emailType || 'general'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="hr">HR</option>
                    <option value="careers">Careers</option>
                    <option value="recruiting">Recruiting</option>
                    <option value="hiring">Hiring Manager</option>
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range
                </label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., $80,000 - $120,000"
                />
              </div>

              {/* Job Link */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.link ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://company.com/jobs/position"
                />
                {errors.link && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.link}
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div>
                <label htmlFor="snippet" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  id="snippet"
                  name="snippet"
                  value={formData.snippet || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Job description and requirements..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactEditForm;