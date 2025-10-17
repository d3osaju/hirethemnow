import React from 'react';
import {
  X,
  Building,
  MapPin,
  Mail,
  Calendar,
  ExternalLink,
  DollarSign,
  FileText,
  Globe,
  Edit,
  Trash2
} from 'lucide-react';
import type { JobOpportunity } from '../../types';

interface ContactDetailModalProps {
  contact: JobOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: JobOpportunity) => void;
  onDelete: (contact: JobOpportunity) => void;
}

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !contact) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{contact.company}</h2>
                <p className="text-sm text-gray-600">{contact.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(contact)}
                className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Edit contact"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(contact)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete contact"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Company</p>
                        <p className="text-sm text-gray-600">{contact.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Job Title</p>
                        <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-600">{contact.location}</p>
                          {contact.isRemote && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Remote
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {contact.salary && (
                      <div className="flex items-start space-x-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Salary</p>
                          <p className="text-sm text-gray-600">{contact.salary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{contact.emails}</p>
                        <p className="text-xs text-gray-500 capitalize mt-1">Type: {contact.emailType}</p>
                      </div>
                    </div>
                    
                    {contact.link && (
                      <div className="flex items-start space-x-3">
                        <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Job Posting</p>
                          <a
                            href={contact.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <span>View Original Posting</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Job Description */}
                {contact.snippet && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.snippet}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date Added</p>
                        <p className="text-sm text-gray-600">{formatDate(contact.createdAt)}</p>
                      </div>
                    </div>
                    
                    {contact.scrapedDate && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Originally Scraped</p>
                          <p className="text-sm text-gray-600">{formatDate(contact.scrapedDate)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contact ID</p>
                        <p className="text-sm text-gray-600">#{contact.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Close
              </button>
              <button
                onClick={() => onEdit(contact)}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Edit Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailModal;